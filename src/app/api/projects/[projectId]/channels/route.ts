import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function verifyAccess(projectId: string) {
  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) return null;
  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
  return project ? orgId : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { projectId } = await params;
  const orgId = await verifyAccess(projectId);
  if (!orgId) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const channels = await prisma.channel.findMany({ where: { projectId } });
  return NextResponse.json(channels);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { projectId } = await params;
  const orgId = await verifyAccess(projectId);
  if (!orgId) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { platform, adAccountId, accessToken, accountName, customerId, refreshToken } = body as {
    platform: string; adAccountId?: string; accessToken?: string; accountName?: string;
    customerId?: string; refreshToken?: string;
  };

  if (!platform) return NextResponse.json({ error: "Platform é obrigatório" }, { status: 400 });

  if (platform === "META") {
    if (!adAccountId || !accessToken) return NextResponse.json({ error: "ID da conta e Access Token são obrigatórios para Meta" }, { status: 400 });
    const normalizedId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const channel = await prisma.channel.upsert({
      where: { projectId_platform: { projectId, platform: "META" } },
      update: { adAccountId: normalizedId, accessToken, accountName: accountName || normalizedId, updatedAt: new Date() },
      create: { projectId, platform: "META", adAccountId: normalizedId, accessToken, accountName: accountName || normalizedId },
    });
    return NextResponse.json(channel);
  }

  if (platform === "GOOGLE") {
    if (!customerId || !refreshToken) return NextResponse.json({ error: "Customer ID e Refresh Token são obrigatórios para Google" }, { status: 400 });
    const channel = await prisma.channel.upsert({
      where: { projectId_platform: { projectId, platform: "GOOGLE" } },
      update: { customerId, refreshToken, accountName: accountName || customerId, updatedAt: new Date() },
      create: { projectId, platform: "GOOGLE", customerId, refreshToken, accountName: accountName || customerId },
    });
    return NextResponse.json(channel);
  }

  return NextResponse.json({ error: "Platform inválido" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { projectId } = await params;
  const orgId = await verifyAccess(projectId);
  if (!orgId) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const { platform } = await req.json();
  await prisma.channel.deleteMany({ where: { projectId, platform } });
  return NextResponse.json({ ok: true });
}
