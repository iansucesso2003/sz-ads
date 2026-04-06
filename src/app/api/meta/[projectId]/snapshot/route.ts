import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface AdInsightInput { ad_id?: string; ad_name?: string; spend?: string; clicks?: string; ctr?: string; impressions?: string; cpc?: string; cpm?: string; }
interface InsightsInput { impressions?: string; clicks?: string; spend?: string; reach?: string; cpc?: string; cpm?: string; ctr?: string; }

async function verifyProject(projectId: string, orgId: string) {
  return prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) return NextResponse.json({ error: "Sem organização" }, { status: 400 });
  const { projectId } = await params;
  const project = await verifyProject(projectId, orgId);
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const body = await req.json();
  const { insights, adsInsights, datePreset, platform = "META" } = body as { insights: InsightsInput; adsInsights: AdInsightInput[]; datePreset: string; platform?: string };
  if (!insights || !datePreset) return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });

  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const existing = await prisma.campaignSnapshot.findFirst({ where: { projectId, platform, datePreset, capturedAt: { gte: today } } });
  const f = (v?: string) => (v ? parseFloat(v) : null);
  const adSnapshotData = (adsInsights ?? []).map((ad) => ({
    adId: ad.ad_id ?? "", adName: ad.ad_name ?? "—",
    spend: f(ad.spend), clicks: f(ad.clicks), ctr: f(ad.ctr),
    impressions: f(ad.impressions), cpc: f(ad.cpc), cpm: f(ad.cpm),
  }));

  if (existing) {
    await prisma.campaignSnapshot.update({
      where: { id: existing.id },
      data: {
        impressions: f(insights.impressions), clicks: f(insights.clicks), spend: f(insights.spend),
        reach: f(insights.reach), cpc: f(insights.cpc), cpm: f(insights.cpm), ctr: f(insights.ctr),
        adSnapshots: { deleteMany: {}, create: adSnapshotData },
      },
    });
    return NextResponse.json({ saved: true, action: "updated" });
  }

  await prisma.campaignSnapshot.create({
    data: {
      projectId, platform, datePreset,
      impressions: f(insights.impressions), clicks: f(insights.clicks), spend: f(insights.spend),
      reach: f(insights.reach), cpc: f(insights.cpc), cpm: f(insights.cpm), ctr: f(insights.ctr),
      adSnapshots: { create: adSnapshotData },
    },
  });
  return NextResponse.json({ saved: true, action: "created" });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) return NextResponse.json({ error: "Sem organização" }, { status: 400 });
  const { projectId } = await params;
  const project = await verifyProject(projectId, orgId);
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const datePreset = req.nextUrl.searchParams.get("datePreset") ?? "last_7d";
  const platform = req.nextUrl.searchParams.get("platform") ?? "META";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "10"), 30);

  const snapshots = await prisma.campaignSnapshot.findMany({
    where: { projectId, platform, datePreset },
    orderBy: { capturedAt: "desc" },
    take: limit,
    include: { adSnapshots: { orderBy: { spend: "desc" }, take: 10 } },
  });

  return NextResponse.json(snapshots);
}
