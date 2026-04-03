import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { fetchAllPages } from "@/lib/meta-api";

const META_API_VERSION = "v21.0";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) {
    return NextResponse.json(
      { error: "Selecione uma organização primeiro" },
      { status: 400 }
    );
  }

  const { projectId } = await params;

  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: projectId,
      organizationId: orgId,
    },
  });

  if (!adAccount) {
    return NextResponse.json(
      { error: "Projeto não encontrado" },
      { status: 404 }
    );
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${adAccount.adAccountId}/ads`;

  try {
    const data = await fetchAllPages(url, adAccount.accessToken, {
      fields: "id,name,status,effective_status,creative{id},created_time",
      effective_status: '["ACTIVE"]',
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[meta ads]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao buscar anúncios" },
      { status: 500 }
    );
  }
}
