import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Você é um gestor de tráfego especialista em Meta Ads, que conversa de forma natural e amigável. Você analisa os dados das campanhas e ajuda o usuário a tomar melhores decisões.

## Sua expertise
- Métricas: CTR, CPC, CPM, CPA, ROAS, alcance, conversões
- Objetivos: Vendas, Leads, Alcance, Engajamento
- Estratégias: CBO, ABO, testes A/B, escalonamento

## Como responder
- Converse de forma leve e acolhedora, como um parceiro de trabalho
- Use os dados do contexto para dar recomendações específicas
- Evite respostas muito longas ou listas excessivas — prefira parágrafos curtos e diretos
- Pode usar emojis com moderação quando fizer sentido (ex: 📈 para resultados bons)
- Comece às vezes com um comentário breve antes de entrar nos dados
- Para recomendações: priorize com "Urgente", "Esta semana", "Para acompanhar"
- Cite nomes de campanhas/anúncios e métricas reais quando tiver os dados
- Se faltar informação, diga de forma amigável o que seria ideal ter

## Tom
- Amigável, próximo e profissional
- Evite linguagem robótica ou excessivamente formal
- Responda sempre em português brasileiro

## IMPORTANTE — Dados da Meta
- NUNCA peça ao usuário para fornecer métricas, CTR, CPC, ROAS ou dados de campanhas — esses dados vêm automaticamente da integração Meta Ads
- Use SEMPRE os dados do contexto quando disponíveis para dar recomendações específicas
- Se o contexto estiver vazio (nenhum dado retornado), sugira verificar se a integração Meta Ads está configurada corretamente no projeto, em vez de pedir que o usuário envie os dados manualmente

## Itens pausados recentemente
- O contexto inclui APENAS campanhas/conjuntos que estavam ativos e foram pausados nos últimos dias (não todas as pausadas da conta)
- Esses itens provavelmente pararam por orçamento esgotado ou pausa acidental — podem não ter sido intencional
- SEMPRE informe ao usuário e destaque: "X campanha(s)/conjunto(s) pausaram recentemente — pode ter sido por investimento acabado"
- Sugira verificar se era para estar pausado e se deseja reativar com novo orçamento`;

async function checkIfNeedsCampaignData(
  openai: OpenAI,
  messages: { role: string; content: string }[],
  lastMessage: string
): Promise<boolean> {
  const lower = lastMessage.trim().toLowerCase();

  const needsDataKeywords = [
    "quantas", "quantos", "quantos ativos", "quantas ativas",
    "como estão", "como está", "analise", "análise", "analisar",
    "desempenho", "métricas", "gastei", "gasto",
    "criativos", "campanhas", "anúncios", "conjuntos",
    "trocar", "pausar", "escalar", "otimizar",
    "perform", "resultados", "impressões", "cliques",
    "/analisar", "/otimizar", "/comparar", "/problemas",
  ];
  if (needsDataKeywords.some((k) => lower.includes(k))) {
    return true;
  }

  const noDataKeywords = ["olá", "oi", "obrigado", "obrigada", "tchau", "até logo", "ok"];
  if (noDataKeywords.includes(lower)) {
    return false;
  }

  const classificationPrompt = `A pergunta do usuário requer dados das campanhas Meta Ads (métricas, anúncios, criativos, desempenho) para ser respondida?

PRECISAM de dados: perguntas sobre quantidade, desempenho, análise, gastos, criativos, campanhas específicas
NÃO precisam: cumprimentos, agradecimentos, perguntas genéricas sem contexto ("o que você faz", "como funciona")

Responda APENAS com SIM ou NÃO.`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: classificationPrompt },
        ...messages.slice(-3).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_tokens: 10,
    });
    const answer = (res.choices[0]?.message?.content ?? "").trim().toUpperCase();
    return answer.startsWith("SIM") || answer.startsWith("YES");
  } catch {
    return true;
  }
}

interface SnapshotRecord {
  capturedAt: string;
  impressions: number | null;
  clicks: number | null;
  spend: number | null;
  reach: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
}

function buildHistoryContext(snapshots: SnapshotRecord[]): string {
  if (!snapshots || snapshots.length < 2) return "";

  const lines = snapshots.map((s) => {
    const date = new Date(s.capturedAt).toLocaleDateString("pt-BR");
    return `- ${date}: gasto R$${s.spend?.toFixed(2) ?? "?"}, cliques ${s.clicks ?? "?"}, CTR ${s.ctr?.toFixed(2) ?? "?"}%, CPC R$${s.cpc?.toFixed(2) ?? "?"}, CPM R$${s.cpm?.toFixed(2) ?? "?"}, impressões ${s.impressions ?? "?"}, alcance ${s.reach ?? "?"}`;
  });

  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];

  const pct = (curr: number | null, prev: number | null) => {
    if (!curr || !prev || prev === 0) return null;
    return (((curr - prev) / Math.abs(prev)) * 100).toFixed(1);
  };

  const deltas = [
    latest.ctr != null && oldest.ctr != null ? `CTR ${pct(latest.ctr, oldest.ctr)}%` : null,
    latest.cpc != null && oldest.cpc != null ? `CPC ${pct(latest.cpc, oldest.cpc)}%` : null,
    latest.cpm != null && oldest.cpm != null ? `CPM ${pct(latest.cpm, oldest.cpm)}%` : null,
    latest.spend != null && oldest.spend != null ? `gasto ${pct(latest.spend, oldest.spend)}%` : null,
    latest.clicks != null && oldest.clicks != null ? `cliques ${pct(latest.clicks, oldest.clicks)}%` : null,
  ].filter(Boolean);

  return `## Histórico de performance (${snapshots.length} análises anteriores)
Variação entre a análise mais antiga e a mais recente: ${deltas.join(", ") || "sem dados suficientes"}
Use esses dados para dizer se a conta está MELHORANDO ou PIORANDO ao longo do tempo.

Snapshots salvos (do mais recente ao mais antigo):
${lines.join("\n")}`;
}

function buildContextMessage(context: {
  campaigns?: unknown[];
  adsets?: unknown[];
  ads?: unknown[];
  insights?: Record<string, unknown>;
  adsInsights?: unknown[];
  pausedCampaigns?: unknown[];
  pausedAdsets?: unknown[];
  snapshots?: SnapshotRecord[];
}) {
  const parts: string[] = [];

  if (context.insights && Object.keys(context.insights).length > 0) {
    parts.push(
      "## Métricas da conta\n" + JSON.stringify(context.insights, null, 2)
    );
  }
  if (context.campaigns?.length) {
    parts.push(
      "## Campanhas ativas\n" +
        JSON.stringify(
          context.campaigns.map((c: unknown) => {
            const camp = c as {
              id?: string;
              name?: string;
              objective?: string;
              daily_budget?: string;
              lifetime_budget?: string;
              effective_status?: string;
            };
            return {
              id: camp.id,
              name: camp.name,
              objective: camp.objective,
              daily_budget: camp.daily_budget,
              lifetime_budget: camp.lifetime_budget,
              status: camp.effective_status,
            };
          }),
          null,
          2
        )
    );
  }
  if (context.adsets?.length) {
    parts.push(
      "## Conjuntos de anúncios\n" +
        JSON.stringify(
          context.adsets.map((a: unknown) => {
            const adset = a as {
              id?: string;
              name?: string;
              daily_budget?: string;
              lifetime_budget?: string;
              effective_status?: string;
            };
            return {
              id: adset.id,
              name: adset.name,
              daily_budget: adset.daily_budget,
              lifetime_budget: adset.lifetime_budget,
              status: adset.effective_status,
            };
          }),
          null,
          2
        )
    );
  }
  if (context.ads?.length) {
    parts.push(
      "## Anúncios\n" +
        JSON.stringify(
          context.ads.map((a: unknown) => {
            const ad = a as { id?: string; name?: string };
            return { id: ad.id, name: ad.name };
          }),
          null,
          2
        )
    );
  }

  if (context.adsInsights?.length) {
    parts.push(
      "## Desempenho por anúncio (dados da Meta)\n" +
        "Use estes dados para recomendar quais criativos trocar, escalar ou pausar. " +
        "Anúncios com CTR baixo (<2%), CPC alto ou sem conversões são candidatos a substituição.\n\n" +
        JSON.stringify(context.adsInsights, null, 2)
    );
  }

  if (context.pausedCampaigns?.length || context.pausedAdsets?.length) {
    const pausedParts: string[] = [];
    if (context.pausedCampaigns?.length) {
      pausedParts.push(
        "### Campanhas pausadas\n" +
          JSON.stringify(
            context.pausedCampaigns.map((c: unknown) => {
              const camp = c as { id?: string; name?: string; objective?: string; daily_budget?: string; lifetime_budget?: string };
              return { id: camp.id, name: camp.name, objective: camp.objective, daily_budget: camp.daily_budget, lifetime_budget: camp.lifetime_budget };
            }),
            null,
            2
          )
      );
    }
    if (context.pausedAdsets?.length) {
      pausedParts.push(
        "### Conjuntos de anúncios pausados\n" +
          JSON.stringify(
            context.pausedAdsets.map((a: unknown) => {
              const adset = a as { id?: string; name?: string; daily_budget?: string; lifetime_budget?: string };
              return { id: adset.id, name: adset.name, daily_budget: adset.daily_budget, lifetime_budget: adset.lifetime_budget };
            }),
            null,
            2
          )
      );
    }
    parts.push(
      "## Itens pausados recentemente (atenção)\n" +
        "Estes itens estavam ATIVOS e foram pausados nos últimos dias. Provável causa: orçamento esgotado (investimento acabou), " +
        "ou pausa manual. NÃO eram para estar pausados se estavam performando. SEMPRE mencione ao usuário e sugira verificar se foi por falta de investimento.\n\n" +
        pausedParts.join("\n\n")
    );
  }

  const historySection = buildHistoryContext(context.snapshots ?? []);
  if (historySection) parts.push(historySection);

  if (parts.length === 0) {
    return "Nenhum dado de campanhas disponível no momento.";
  }
  return "Dados atualizados em tempo real da Meta Ads.\n\n" + parts.join("\n\n");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const orgId = (await cookies()).get("org-id")?.value;
  if (!orgId) {
    return NextResponse.json(
      { error: "Selecione uma organização" },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { messages, projectId, datePreset = "last_7d", analysisObjective = "geral" } = body as {
      messages: { role: string; content: string }[];
      projectId?: string;
      datePreset?: string;
      analysisObjective?: string;
    };

    if (!messages?.length || typeof messages[messages.length - 1]?.content !== "string") {
      return NextResponse.json(
        { error: "Mensagens inválidas" },
        { status: 400 }
      );
    }

    let context: {
      campaigns?: unknown[];
      adsets?: unknown[];
      ads?: unknown[];
      insights?: Record<string, unknown>;
      adsInsights?: unknown[];
      pausedCampaigns?: unknown[];
      pausedAdsets?: unknown[];
      snapshots?: SnapshotRecord[];
    } = {};

    const lastMessage = messages[messages.length - 1]?.content ?? "";
    const needsCampaignData = await checkIfNeedsCampaignData(openai, messages, lastMessage);

    if (projectId && needsCampaignData) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const cookie = req.headers.get("cookie") || "";
      const headers: Record<string, string> = cookie ? { Cookie: cookie } : {};

      const [campRes, adsetRes, adRes, insightsRes, adsInsightsRes, pausedRes, snapshotsRes] = await Promise.all([
        fetch(`${baseUrl}/api/meta/${projectId}/campaigns`, { headers }),
        fetch(`${baseUrl}/api/meta/${projectId}/adsets`, { headers }),
        fetch(`${baseUrl}/api/meta/${projectId}/ads`, { headers }),
        fetch(`${baseUrl}/api/meta/${projectId}/insights?date_preset=${datePreset}`, { headers }),
        fetch(`${baseUrl}/api/meta/${projectId}/ads-insights?date_preset=${datePreset}`, { headers }),
        fetch(`${baseUrl}/api/meta/${projectId}/paused?date_preset=${datePreset}`, { headers }),
        fetch(`${baseUrl}/api/meta/${projectId}/snapshot?datePreset=${datePreset}&limit=10`, { headers }),
      ]);

      const campData = await campRes.json();
      const adsetData = await adsetRes.json();
      const adData = await adRes.json();
      const insightsData = await insightsRes.json();
      const adsInsightsData = await adsInsightsRes.json();
      const pausedData = await pausedRes.json();
      const snapshotsData = await snapshotsRes.json();

      const pausedCampaigns = pausedData.error ? [] : (pausedData.campaigns ?? []);
      const pausedAdsets = pausedData.error ? [] : (pausedData.adsets ?? []);

      context = {
        campaigns: Array.isArray(campData) ? campData : campData.error ? [] : [],
        adsets: Array.isArray(adsetData) ? adsetData : adsetData.error ? [] : [],
        ads: Array.isArray(adData) ? adData : adData.error ? [] : [],
        insights: insightsData.error ? {} : insightsData,
        adsInsights: Array.isArray(adsInsightsData) ? adsInsightsData : adsInsightsData.error ? [] : [],
        pausedCampaigns: Array.isArray(pausedCampaigns) ? pausedCampaigns : [],
        pausedAdsets: Array.isArray(pausedAdsets) ? pausedAdsets : [],
        snapshots: Array.isArray(snapshotsData) ? snapshotsData : [],
      };
    }

    const contextText = buildContextMessage(context);
    const objectiveInstructions: Record<string, string> = {
      geral: "Faça uma análise geral equilibrada, considerando todas as métricas relevantes ao contexto.",
      vendas: "PRIORIZE o objetivo VENDAS. Use o conjunto de métricas: ROAS, conversões de compra, receita, CPA de compra. Recomende criativos/campanhas que geram mais vendas e identifique o que está convertendo ou não.",
      leads: "PRIORIZE o objetivo LEADS (Cadastro). Use o conjunto de métricas: conversões de lead, CPA de lead, taxa de conversão. Recomende criativos/campanhas que captam melhor e identifique gargalos na captação.",
      trafego: "PRIORIZE o objetivo TRÁFEGO. Use o conjunto de métricas: CTR, CPC, cliques, bounce rate. Recomende criativos que atraem cliques e otimizem o custo por clique.",
      engajamento: "PRIORIZE o objetivo ENGAJAMENTO. Use o conjunto de métricas: likes, comentários, shares, saves, CTR. Recomende criativos que geram mais interação.",
      alcance: "PRIORIZE o objetivo ALCANCE. Use o conjunto de métricas: impressões, alcance, frequência, CPM. Recomende campanhas por visibilidade e alcance.",
    };
    const objectiveInstruction = objectiveInstructions[analysisObjective] ?? objectiveInstructions.geral;
    const systemContent = `${SYSTEM_PROMPT}\n\n---\nContexto atual das campanhas:\n\n${contextText}\n\n---\nObjetivo da análise solicitado pelo usuário: ${objectiveInstruction}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "Desculpe, não consegui gerar uma resposta.";
    return NextResponse.json({ content: reply });
  } catch (e) {
    console.error("[chat]", e);
    const message = e instanceof Error ? e.message : "Erro ao processar";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
