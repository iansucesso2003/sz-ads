import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { fetchAllPages } from "@/lib/meta-api";

const META_API_VERSION = "v21.0";

/** Converte date_preset em dias para filtrar itens pausados recentemente */
function presetToDays(datePreset: string): number {
  const map: Record<string, number> = {
    today: 1,
    yesterday: 1,
    last_7d: 7,
    last_14d: 14,
    last_30d: 30,
    last_90d: 30, // mesmo em 90d, focamos em pausados nos últimos 30 dias
  };
  return map[datePreset] ?? 7;
}

export async function GET(
  req: NextRequest,
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
  const datePreset = req.nextUrl.searchParams.get("date_preset") || "last_7d";
  const days = presetToDays(datePreset);

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

  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

  const filterRecentlyPaused = <T extends { updated_time?: string }>(items: T[]): T[] => {
    return items.filter((item) => {
      const ut = item.updated_time;
      if (!ut) return false; // sem updated_time, não sabemos se é recente — exclui
      const ts = typeof ut === "string" ? new Date(ut).getTime() : Number(ut) * 1000;
      return !Number.isNaN(ts) && ts >= cutoffMs;
    });
  };

  try {
    const [allCampaigns, allAdsets] = await Promise.all([
      fetchAllPages(
        `https://graph.facebook.com/${META_API_VERSION}/${adAccount.adAccountId}/campaigns`,
        adAccount.accessToken,
        {
          fields: "id,name,objective,effective_status,daily_budget,lifetime_budget,created_time,updated_time",
          effective_status: '["PAUSED"]',
        },
        200
      ),
      fetchAllPages(
        `https://graph.facebook.com/${META_API_VERSION}/${adAccount.adAccountId}/adsets`,
        adAccount.accessToken,
        {
          fields: "id,name,effective_status,daily_budget,lifetime_budget,created_time,updated_time",
          effective_status: '["PAUSED"]',
        },
        200
      ),
    ]);

    const campaigns = filterRecentlyPaused(allCampaigns as { updated_time?: string }[]);
    const adsets = filterRecentlyPaused(allAdsets as { updated_time?: string }[]);

    return NextResponse.json({ campaigns, adsets });
  } catch (e) {
    console.error("[meta paused]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao buscar itens pausados" },
      { status: 500 }
    );
  }
}
