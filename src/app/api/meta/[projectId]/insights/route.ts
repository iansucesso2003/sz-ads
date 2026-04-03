import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const META_API_VERSION = "v21.0";

export async function GET(
  req: NextRequest,
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

  const datePreset = req.nextUrl.searchParams.get("date_preset") || "last_7d";

  const url = new URL(
    `https://graph.facebook.com/${META_API_VERSION}/${adAccount.adAccountId}/insights`
  );
  url.searchParams.set("access_token", adAccount.accessToken);
  url.searchParams.set("fields", "impressions,clicks,spend,reach,cpc,cpm,ctr");
  url.searchParams.set("date_preset", datePreset);

  try {
    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Erro na API Meta" },
        { status: 400 }
      );
    }

    const insights = data.data?.[0] || {};
    return NextResponse.json(insights);
  } catch (e) {
    console.error("[meta insights]", e);
    return NextResponse.json(
      { error: "Erro ao buscar métricas" },
      { status: 500 }
    );
  }
}
