import { auth } from "@/lib/auth";
import { getMetaChannel } from "@/lib/get-channel";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { fetchAllPages } from "@/lib/meta-api";

const META_API_VERSION = "v21.0";

function presetToDays(datePreset: string): number {
  const map: Record<string, number> = { today: 1, yesterday: 1, last_7d: 7, last_14d: 14, last_30d: 30, last_90d: 30 };
  return map[datePreset] ?? 7;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) return NextResponse.json({ error: "Selecione uma organização primeiro" }, { status: 400 });
  const { projectId } = await params;
  const channel = await getMetaChannel(projectId, orgId);
  if (!channel?.adAccountId || !channel?.accessToken) return NextResponse.json({ error: "Canal Meta não encontrado" }, { status: 404 });

  const datePreset = req.nextUrl.searchParams.get("date_preset") || "last_7d";
  const cutoffMs = Date.now() - presetToDays(datePreset) * 24 * 60 * 60 * 1000;

  const filterRecentlyPaused = <T extends { updated_time?: string }>(items: T[]): T[] =>
    items.filter((item) => {
      const ut = item.updated_time;
      if (!ut) return false;
      const ts = new Date(ut).getTime();
      return !Number.isNaN(ts) && ts >= cutoffMs;
    });

  try {
    const [allCampaigns, allAdsets] = await Promise.all([
      fetchAllPages(
        `https://graph.facebook.com/${META_API_VERSION}/${channel.adAccountId}/campaigns`,
        channel.accessToken,
        { fields: "id,name,objective,effective_status,daily_budget,lifetime_budget,created_time,updated_time", effective_status: '["PAUSED"]' },
        200
      ),
      fetchAllPages(
        `https://graph.facebook.com/${META_API_VERSION}/${channel.adAccountId}/adsets`,
        channel.accessToken,
        { fields: "id,name,effective_status,daily_budget,lifetime_budget,created_time,updated_time", effective_status: '["PAUSED"]' },
        200
      ),
    ]);

    return NextResponse.json({
      campaigns: filterRecentlyPaused(allCampaigns as { updated_time?: string }[]),
      adsets: filterRecentlyPaused(allAdsets as { updated_time?: string }[]),
    });
  } catch (e) {
    console.error("[meta paused]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
