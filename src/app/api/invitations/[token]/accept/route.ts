import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) return NextResponse.json({ error: "Convite inválido" }, { status: 404 });
  if (invitation.acceptedAt) return NextResponse.json({ error: "Convite já utilizado" }, { status: 400 });
  if (invitation.expiresAt < new Date()) return NextResponse.json({ error: "Convite expirado" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.email !== invitation.email) {
    return NextResponse.json({ error: "Este convite é para outro email" }, { status: 403 });
  }

  // Check if already a member
  const existing = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id, organizationId: invitation.organizationId },
  });

  if (!existing) {
    await prisma.userOrganization.create({
      data: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });
  }

  await prisma.invitation.update({ where: { token }, data: { acceptedAt: new Date() } });

  return NextResponse.json({ organizationId: invitation.organizationId });
}
