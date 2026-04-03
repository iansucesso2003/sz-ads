import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orgId } = await params;

  const membership = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id, organizationId: orgId },
  });
  if (!membership) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });

  const members = await prisma.userOrganization.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orgId } = await params;
  const { userId } = await req.json();

  const callerMembership = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id, organizationId: orgId },
  });
  if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const targetMembership = await prisma.userOrganization.findFirst({
    where: { userId, organizationId: orgId },
  });
  if (!targetMembership) return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  if (targetMembership.role === "owner") return NextResponse.json({ error: "Não é possível remover o dono" }, { status: 400 });

  await prisma.userOrganization.delete({ where: { id: targetMembership.id } });
  return NextResponse.json({ ok: true });
}
