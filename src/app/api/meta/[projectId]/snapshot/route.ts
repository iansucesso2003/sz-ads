import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface AdInsightInput {
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  clicks?: string;
  ctr?: string;
  impressions?: string;
  cpc?: string;
  cpm?: string;
}

interface InsightsInput {
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
}

// POST /api/meta/[projectId]/snapshot
// Salva um snapshot das métricas atuais (chamado automaticamente pelo dashboard)
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) return NextResponse.json({ error: "Sem organização" }, { status: 400 });

  const { projectId } = await params;

  const adAccount = await prisma.adAccount.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!adAccount) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const body = await req.json();
  const { insights, adsInsights, datePreset } = body as {
    insights: InsightsInput;
    adsInsights: AdInsightInput[];
    datePreset: string;
  };

  if (!insights || !datePreset) return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });

  // Um snapshot por projeto por datePreset por dia (usa a data UTC truncada)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Verifica se já existe snapshot hoje para esse projeto+datePreset
  const existing = await prisma.campaignSnapshot.findFirst({
    where: {
      adAccountId: projectId,
      datePreset,
      capturedAt: { gte: today },
    },
  });

  const f = (v?: string) => (v ? parseFloat(v) : null);

  if (existing) {
    // Atualiza o snapshot do dia com os dados mais recentes
    await prisma.campaignSnapshot.update({
      where: { id: existing.id },
      data: {
        impressions: f(insights.impressions),
        clicks: f(insights.clicks),
        spend: f(insights.spend),
        reach: f(insights.reach),
        cpc: f(insights.cpc),
        cpm: f(insights.cpm),
        ctr: f(insights.ctr),
        adSnapshots: {
          deleteMany: {},
          create: (adsInsights ?? []).map((ad) => ({
            adId: ad.ad_id ?? "",
            adName: ad.ad_name ?? "—",
            spend: f(ad.spend),
            clicks: f(ad.clicks),
            ctr: f(ad.ctr),
            impressions: f(ad.impressions),
            cpc: f(ad.cpc),
            cpm: f(ad.cpm),
          })),
        },
      },
    });
    return NextResponse.json({ saved: true, action: "updated" });
  }

  await prisma.campaignSnapshot.create({
    data: {
      adAccountId: projectId,
      datePreset,
      impressions: f(insights.impressions),
      clicks: f(insights.clicks),
      spend: f(insights.spend),
      reach: f(insights.reach),
      cpc: f(insights.cpc),
      cpm: f(insights.cpm),
      ctr: f(insights.ctr),
      adSnapshots: {
        create: (adsInsights ?? []).map((ad) => ({
          adId: ad.ad_id ?? "",
          adName: ad.ad_name ?? "—",
          spend: f(ad.spend),
          clicks: f(ad.clicks),
          ctr: f(ad.ctr),
          impressions: f(ad.impressions),
          cpc: f(ad.cpc),
          cpm: f(ad.cpm),
        })),
      },
    },
  });

  return NextResponse.json({ saved: true, action: "created" });
}

// GET /api/meta/[projectId]/snapshot?datePreset=last_7d&limit=5
// Retorna os últimos N snapshots para comparação e contexto histórico
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) return NextResponse.json({ error: "Sem organização" }, { status: 400 });

  const { projectId } = await params;

  const adAccount = await prisma.adAccount.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!adAccount) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const datePreset = req.nextUrl.searchParams.get("datePreset") ?? "last_7d";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "10"), 30);

  const snapshots = await prisma.campaignSnapshot.findMany({
    where: { adAccountId: projectId, datePreset },
    orderBy: { capturedAt: "desc" },
    take: limit,
    include: {
      adSnapshots: {
        orderBy: { spend: "desc" },
        take: 10,
      },
    },
  });

  return NextResponse.json(snapshots);
}
