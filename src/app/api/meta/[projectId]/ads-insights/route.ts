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
    return NextResponse.json(
      { error: "Selecione uma organização primeiro" },
      { status: 400 }
    );
  }

  const { projectId } = await params;

  const adAccount = await prisma.adAccount.findFirst({
    where: { id: projectId, organizationId: orgId },
  });

  if (!adAccount) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  const datePreset = req.nextUrl.searchParams.get("date_preset") || "last_7d";

  const url = new URL(
    `https://graph.facebook.com/${META_API_VERSION}/${adAccount.adAccountId}/insights`
  );
  url.searchParams.set("access_token", adAccount.accessToken);
  url.searchParams.set("level", "ad");
  url.searchParams.set(
    "fields",
    "ad_id,ad_name,impressions,clicks,spend,ctr,cpc,cpm,reach,frequency,actions,action_values"
  );
  url.searchParams.set("date_preset", datePreset);
  url.searchParams.set("limit", "100");

  try {
    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Erro na API Meta" },
        { status: 400 }
      );
    }

    const adsInsights = data.data || [];
    return NextResponse.json(adsInsights);
  } catch (e) {
    console.error("[meta ads-insights]", e);
    return NextResponse.json(
      { error: "Erro ao buscar métricas dos anúncios" },
      { status: 500 }
    );
  }
}
