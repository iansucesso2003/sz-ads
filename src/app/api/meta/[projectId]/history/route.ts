import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const META_API_VERSION = "v21.0";

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) {
    return NextResponse.json({ error: "Selecione uma organização primeiro" }, { status: 400 });
  }

  const { projectId } = await params;

  const adAccount = await prisma.adAccount.findFirst({
    where: { id: projectId, organizationId: orgId },
  });

  if (!adAccount) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") || "7");
  const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const until = new Date().toISOString().split("T")[0];

  const url = new URL(
    `https://graph.facebook.com/${META_API_VERSION}/${adAccount.adAccountId}/insights`
  );
  url.searchParams.set("access_token", adAccount.accessToken);
  url.searchParams.set("fields", "date_start,impressions,clicks,spend,reach");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("time_range", JSON.stringify({ since, until }));
  url.searchParams.set("limit", "90");

  try {
    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json(data.data || []);
  } catch (e) {
    console.error("[meta history]", e);
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 });
  }
}
