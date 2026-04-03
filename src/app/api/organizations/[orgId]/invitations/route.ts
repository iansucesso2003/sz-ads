import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orgId } = await params;

  const membership = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id, organizationId: orgId, role: { in: ["owner", "admin"] } },
  });
  if (!membership) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const invitations = await prisma.invitation.findMany({
    where: { organizationId: orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
    include: { invitedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orgId } = await params;
  const { email, role = "member" } = await req.json();

  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  const membership = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id, organizationId: orgId, role: { in: ["owner", "admin"] } },
  });
  if (!membership) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  // Check if already a member
  const existingMember = await prisma.userOrganization.findFirst({
    where: { organizationId: orgId, user: { email } },
  });
  if (existingMember) return NextResponse.json({ error: "Usuário já é membro" }, { status: 400 });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.upsert({
    where: { organizationId_email: { organizationId: orgId, email } },
    update: { token: crypto.randomUUID(), expiresAt, role, invitedById: session.user.id, acceptedAt: null },
    create: { organizationId: orgId, email, role, invitedById: session.user.id, expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/convite/${invitation.token}`;

  return NextResponse.json({ invitation, inviteUrl });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orgId } = await params;
  const { invitationId } = await req.json();

  const membership = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id, organizationId: orgId, role: { in: ["owner", "admin"] } },
  });
  if (!membership) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  await prisma.invitation.deleteMany({ where: { id: invitationId, organizationId: orgId } });
  return NextResponse.json({ ok: true });
}
