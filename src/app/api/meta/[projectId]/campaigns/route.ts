import { auth } from "@/lib/auth";
import { getMetaChannel } from "@/lib/get-channel";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { fetchAllPages } from "@/lib/meta-api";

const META_API_VERSION = "v21.0";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) return NextResponse.json({ error: "Selecione uma organização primeiro" }, { status: 400 });
  const { projectId } = await params;
  const channel = await getMetaChannel(projectId, orgId);
  if (!channel?.adAccountId || !channel?.accessToken) return NextResponse.json({ error: "Canal Meta não encontrado" }, { status: 404 });

  const withImpressions = _req.nextUrl.searchParams.get("with_impressions") === "1";
  const datePreset = _req.nextUrl.searchParams.get("date_preset") || "last_30d";
  const queryParams: Record<string, string> = {
    fields: "id,name,status,objective,effective_status,daily_budget,lifetime_budget,created_time",
    effective_status: '["ACTIVE"]',
  };

  try {
    let data = await fetchAllPages(
      `https://graph.facebook.com/${META_API_VERSION}/${channel.adAccountId}/campaigns`,
      channel.accessToken,
      queryParams
    );

    if (withImpressions && data.length > 0) {
      const insightsRes = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${channel.adAccountId}/insights?access_token=${encodeURIComponent(channel.accessToken)}&level=campaign&fields=campaign_id,impressions&date_preset=${encodeURIComponent(datePreset)}&limit=500`
      );
      const insightsData = (await insightsRes.json()) as { data?: { campaign_id?: string; impressions?: string }[]; error?: { message: string } };
      if (!insightsData.error && insightsData.data) {
        const ids = new Set(insightsData.data.filter((r) => Number(r.impressions ?? 0) > 0).map((r) => r.campaign_id).filter(Boolean));
        data = data.filter((c: unknown) => ids.has((c as { id: string }).id));
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[meta campaigns]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao buscar campanhas" }, { status: 500 });
  }
}
