// Legacy compatibility — use /api/projects instead
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getOrgId() {
  return (await cookies()).get("org-id")?.value ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = await getOrgId();
  if (!orgId) return NextResponse.json({ error: "Selecione uma organização primeiro" }, { status: 400 });

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: { channels: { where: { platform: "META" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      adAccountId: p.channels[0]?.adAccountId ?? "",
      accountName: p.name,
      createdAt: p.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = await getOrgId();
  if (!orgId) return NextResponse.json({ error: "Selecione uma organização primeiro" }, { status: 400 });

  const membership = await prisma.userOrganization.findFirst({ where: { userId: session.user.id, organizationId: orgId } });
  if (!membership) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const adAccountId = (body.adAccountId as string)?.trim();
  const accessToken = (body.accessToken as string)?.trim();
  const accountName = (body.accountName as string)?.trim();

  if (!adAccountId || !accessToken) return NextResponse.json({ error: "ID da conta e Access Token são obrigatórios" }, { status: 400 });

  const normalizedId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  // Check duplicate
  const dup = await prisma.channel.findFirst({ where: { platform: "META", adAccountId: normalizedId, project: { organizationId: orgId } } });
  if (dup) return NextResponse.json({ error: "Esta conta de anúncios já está conectada" }, { status: 409 });

  // Create project + META channel
  const project = await prisma.project.create({
    data: {
      organizationId: orgId,
      name: accountName || normalizedId,
      channels: {
        create: { platform: "META", adAccountId: normalizedId, accessToken, accountName: accountName || normalizedId },
      },
    },
  });

  return NextResponse.json({ id: project.id, adAccountId: normalizedId, accountName: project.name, createdAt: project.createdAt });
}
