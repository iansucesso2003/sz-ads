import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { fetchAllPages } from "@/lib/meta-api";

const META_API_VERSION = "v21.0";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) {
    return NextResponse.json(
      { error: "Selecione uma organização primeiro" },
      { status: 400 }
    );
  }

  const { projectId } = await params;

  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: projectId,
      organizationId: orgId,
    },
  });

  if (!adAccount) {
    return NextResponse.json(
      { error: "Projeto não encontrado" },
      { status: 404 }
    );
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${adAccount.adAccountId}/campaigns`;
  const withImpressions = _req.nextUrl.searchParams.get("with_impressions") === "1";
  const datePreset = _req.nextUrl.searchParams.get("date_preset") || "last_30d";

  const queryParams: Record<string, string> = {
    fields: "id,name,status,objective,effective_status,daily_budget,lifetime_budget,created_time",
    effective_status: '["ACTIVE"]',
  };

  try {
    let data = await fetchAllPages(url, adAccount.accessToken, queryParams);

    if (withImpressions && data.length > 0) {
      const insightsUrl = `https://graph.facebook.com/${META_API_VERSION}/${adAccount.adAccountId}/insights`;
      const insightsRes = await fetch(
        `${insightsUrl}?access_token=${encodeURIComponent(adAccount.accessToken)}&level=campaign&fields=campaign_id,impressions&date_preset=${encodeURIComponent(datePreset)}&limit=500`
      );
      const insightsData = (await insightsRes.json()) as {
        data?: { campaign_id?: string; impressions?: string }[];
        error?: { message: string };
      };

      if (!insightsData.error && insightsData.data) {
        const campaignIdsWithImpressions = new Set(
          insightsData.data
            .filter((r) => Number(r.impressions ?? 0) > 0)
            .map((r) => r.campaign_id)
            .filter(Boolean)
        );
        data = data.filter((c: unknown) => campaignIdsWithImpressions.has((c as { id: string }).id));
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[meta campaigns]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao buscar campanhas" },
      { status: 500 }
    );
  }
}
