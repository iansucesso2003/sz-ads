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
  if (!orgId) return NextResponse.json({ error: "Selecione uma organização" }, { status: 400 });

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: { channels: { select: { id: true, platform: true, adAccountId: true, accountName: true, customerId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = await getOrgId();
  if (!orgId) return NextResponse.json({ error: "Selecione uma organização" }, { status: 400 });

  const membership = await prisma.userOrganization.findFirst({ where: { userId: session.user.id, organizationId: orgId } });
  if (!membership) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { name } = body as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const project = await prisma.project.create({
    data: { organizationId: orgId, name: name.trim() },
    include: { channels: true },
  });

  return NextResponse.json(project);
}
