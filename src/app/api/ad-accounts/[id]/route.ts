import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("org-id")?.value ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const adAccount = await prisma.adAccount.findFirst({
    where: { id, organizationId: orgId },
  });

  if (!adAccount) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: adAccount.id,
    adAccountId: adAccount.adAccountId,
    accountName: adAccount.accountName,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const adAccount = await prisma.adAccount.findFirst({
    where: { id, organizationId: orgId },
  });

  if (!adAccount) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
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
      NOT: { id },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Esta conta de anúncios já está conectada em outro projeto" },
      { status: 409 }
    );
  }

  const updated = await prisma.adAccount.update({
    where: { id },
    data: {
      adAccountId: normalizedId,
      accessToken,
      accountName: accountName || normalizedId,
    },
  });

  return NextResponse.json({
    id: updated.id,
    adAccountId: updated.adAccountId,
    accountName: updated.accountName,
  });
}
