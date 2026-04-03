import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("org-id")?.value ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Selecione uma organização primeiro" },
      { status: 400 }
    );
  }

  const memberships = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id, organizationId: orgId },
  });
  if (!memberships) {
    return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  }

  const adAccounts = await prisma.adAccount.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    adAccounts.map((a) => ({
      id: a.id,
      adAccountId: a.adAccountId,
      accountName: a.accountName,
      createdAt: a.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Selecione uma organização primeiro" },
      { status: 400 }
    );
  }

  const memberships = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id, organizationId: orgId },
  });
  if (!memberships) {
    return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const adAccountId = (body.adAccountId as string)?.trim();
  const accessToken = (body.accessToken as string)?.trim();
  const accountName = (body.accountName as string)?.trim();

  if (!adAccountId || !accessToken) {
    return NextResponse.json(
      { error: "ID da conta e Access Token são obrigatórios" },
      { status: 400 }
    );
  }

  const normalizedId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  const existing = await prisma.adAccount.findFirst({
    where: {
      organizationId: orgId,
      adAccountId: normalizedId,
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Esta conta de anúncios já está conectada" },
      { status: 409 }
    );
  }

  const adAccount = await prisma.adAccount.create({
    data: {
      organizationId: orgId,
      adAccountId: normalizedId,
      accountName: accountName || normalizedId,
      accessToken,
    },
  });

  return NextResponse.json({
    id: adAccount.id,
    adAccountId: adAccount.adAccountId,
    accountName: adAccount.accountName,
    createdAt: adAccount.createdAt,
  });
}
