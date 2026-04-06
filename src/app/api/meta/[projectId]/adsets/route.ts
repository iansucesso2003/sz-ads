import { auth } from "@/lib/auth";
import { getMetaChannel } from "@/lib/get-channel";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { fetchAllPages } from "@/lib/meta-api";

const META_API_VERSION = "v21.0";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) return NextResponse.json({ error: "Selecione uma organização primeiro" }, { status: 400 });
  const { projectId } = await params;
  const channel = await getMetaChannel(projectId, orgId);
  if (!channel?.adAccountId || !channel?.accessToken) return NextResponse.json({ error: "Canal Meta não encontrado" }, { status: 404 });
  try {
    const data = await fetchAllPages(
      `https://graph.facebook.com/${META_API_VERSION}/${channel.adAccountId}/adsets`,
      channel.accessToken,
      { fields: "id,name,status,effective_status,daily_budget,lifetime_budget,targeting,created_time", effective_status: '["ACTIVE"]' }
    );
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao buscar conjuntos" }, { status: 500 });
  }
}
