// Legacy compatibility — project = old AdAccount, channel META = credentials
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getOrgId() {
  return (await cookies()).get("org-id")?.value ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = await getOrgId();
  if (!orgId) return NextResponse.json({ error: "Selecione uma organização primeiro" }, { status: 400 });
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: orgId },
    include: { channels: { where: { platform: "META" } } },
  });
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const ch = project.channels[0];
  return NextResponse.json({ id: project.id, adAccountId: ch?.adAccountId ?? "", accountName: project.name });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = await getOrgId();
  if (!orgId) return NextResponse.json({ error: "Selecione uma organização primeiro" }, { status: 400 });
  const { id } = await params;

  const project = await prisma.project.findFirst({ where: { id, organizationId: orgId } });
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const adAccountId = (body.adAccountId as string)?.trim();
  const accessToken = (body.accessToken as string)?.trim();
  const accountName = (body.accountName as string)?.trim();

  if (!adAccountId || !accessToken) return NextResponse.json({ error: "ID da conta e Access Token são obrigatórios" }, { status: 400 });
  const normalizedId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  // Upsert channel META + update project name
  await prisma.$transaction([
    prisma.project.update({ where: { id }, data: { name: accountName || normalizedId } }),
    prisma.channel.upsert({
      where: { projectId_platform: { projectId: id, platform: "META" } },
      update: { adAccountId: normalizedId, accessToken, accountName: accountName || normalizedId },
      create: { projectId: id, platform: "META", adAccountId: normalizedId, accessToken, accountName: accountName || normalizedId },
    }),
  ]);

  return NextResponse.json({ id, adAccountId: normalizedId, accountName: accountName || normalizedId });
}
