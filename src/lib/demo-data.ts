export const DEMO_INSIGHTS = {
  impressions: "284500",
  clicks: "3920",
  spend: "1840.50",
  reach: "198200",
  cpc: "0.47",
  cpm: "6.47",
  ctr: "1.38",
};

export const DEMO_ADS_INSIGHTS = [
  { ad_id: "1", ad_name: "Criativo Vídeo - Produto Principal", spend: "620.00", clicks: "1340", ctr: "2.10", impressions: "63800" },
  { ad_id: "2", ad_name: "Carrossel - Benefícios", spend: "410.50", clicks: "890", ctr: "1.75", impressions: "50900" },
  { ad_id: "3", ad_name: "Imagem Estática - Oferta", spend: "310.00", clicks: "720", ctr: "1.62", impressions: "44400" },
  { ad_id: "4", ad_name: "Vídeo Curto - Depoimento", spend: "240.00", clicks: "530", ctr: "1.48", impressions: "35800" },
  { ad_id: "5", ad_name: "Stories - Black Friday", spend: "160.00", clicks: "280", ctr: "1.20", impressions: "23300" },
  { ad_id: "6", ad_name: "Reels - Novo Produto", spend: "100.00", clicks: "160", ctr: "0.98", impressions: "16300" },
];

export const DEMO_HISTORY = [
  { date_start: "2024-03-26", spend: "210.50", clicks: "480", impressions: "34200" },
  { date_start: "2024-03-27", spend: "195.00", clicks: "420", impressions: "31800" },
  { date_start: "2024-03-28", spend: "280.00", clicks: "610", impressions: "42500" },
  { date_start: "2024-03-29", spend: "260.00", clicks: "570", impressions: "39600" },
  { date_start: "2024-03-30", spend: "310.00", clicks: "690", impressions: "48100" },
  { date_start: "2024-03-31", spend: "290.00", clicks: "630", impressions: "45200" },
  { date_start: "2024-04-01", spend: "295.00", clicks: "520", impressions: "43100" },
];

export const DEMO_CAMPAIGNS = [
  { id: "1", name: "Campanha Conversão - Produto A", status: "ACTIVE", effective_status: "ACTIVE" },
  { id: "2", name: "Campanha Tráfego - Blog", status: "ACTIVE", effective_status: "ACTIVE" },
  { id: "3", name: "Campanha Leads - Webinar", status: "ACTIVE", effective_status: "ACTIVE" },
];

export const DEMO_CHAT_RESPONSES: Record<string, string> = {
  default: `📊 **Análise da sua conta (Demonstração)**

Baseado nos dados dos últimos 7 dias:

**Destaques positivos:**
- CTR de 1,38% está acima da média do mercado (0,90%)
- CPM de R$6,47 é eficiente para o segmento
- O criativo "Vídeo - Produto Principal" representa 34% do gasto mas entrega 2,10% de CTR

**Oportunidades de melhoria:**
- O anúncio "Reels - Novo Produto" tem CTR abaixo de 1% — considere pausar e testar novo criativo
- Gasto concentrado em 2 criativos — diversifique para reduzir risco
- CPC de R$0,47 está ótimo — há espaço para escalar o orçamento

**Recomendação:** Aumente o budget do "Criativo Vídeo - Produto Principal" em 20-30% e pause o último anúncio.`,

  otimizar: `🚀 **Sugestões de Otimização**

1. **Escalar o que funciona:** "Criativo Vídeo - Produto Principal" tem o melhor CTR (2,10%) — aumente o budget em R$100/dia
2. **Pausar o fraco:** "Reels - Novo Produto" tem CTR abaixo de 1% — pause e teste nova copy
3. **Testar novos públicos:** Crie lookalike de 2% dos seus compradores
4. **Horário:** Concentre verba entre 19h-23h (maior engajamento no Brasil)
5. **Criativos:** Teste vídeos de 6-15s para Stories — CPM costuma ser 30% menor`,

  analisar: `📈 **Relatório Completo - Últimos 7 dias**

| Métrica | Valor | Benchmark |
|---------|-------|-----------|
| Impressões | 284.500 | — |
| Cliques | 3.920 | — |
| CTR | 1,38% | 0,90% ✅ |
| CPM | R$6,47 | R$8,00 ✅ |
| CPC | R$0,47 | R$0,80 ✅ |
| Gasto Total | R$1.840,50 | — |

**Performance por dia:** Pico na sexta-feira (R$310) — considere aumentar budget no final de semana.`,
};
