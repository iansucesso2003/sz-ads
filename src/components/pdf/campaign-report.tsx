"use client";

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
});

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Inter", backgroundColor: "#fff", fontSize: 10, color: "#111" },
  header: { marginBottom: 24, borderBottom: "1 solid #e5e7eb", paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, color: "#1e1b4b" },
  subtitle: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#1e1b4b", marginBottom: 10, borderLeft: "3 solid #4f46e5", paddingLeft: 8 },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 8, padding: 12, border: "1 solid #e5e7eb" },
  cardLabel: { fontSize: 9, color: "#6b7280", marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: 700, color: "#111827" },
  cardSub: { fontSize: 8, color: "#9ca3af", marginTop: 2 },
  table: { border: "1 solid #e5e7eb", borderRadius: 6, overflow: "hidden" },
  tableHead: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "6 10" },
  tableRow: { flexDirection: "row", padding: "6 10", borderTop: "1 solid #f3f4f6" },
  tableCell: { flex: 1, fontSize: 9 },
  tableCellBold: { flex: 2, fontSize: 9, fontWeight: 700 },
  badge: { alignSelf: "flex-start", backgroundColor: "#ede9fe", borderRadius: 4, padding: "2 6", fontSize: 8, color: "#5b21b6", marginTop: 4 },
  aiBox: { backgroundColor: "#f0f9ff", borderRadius: 8, padding: 14, border: "1 solid #bae6fd" },
  aiText: { fontSize: 10, color: "#0c4a6e", lineHeight: 1.6 },
  footer: { marginTop: 32, borderTop: "1 solid #e5e7eb", paddingTop: 12, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

interface AdInsight {
  ad_name?: string;
  spend?: string;
  clicks?: string;
  ctr?: string;
  impressions?: string;
}

interface Insights {
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
}

interface Props {
  accountName: string;
  datePreset: string;
  insights: Insights;
  adsInsights: AdInsight[];
  aiSuggestion?: string;
}

function fmt(val?: string, currency = false) {
  if (!val) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  if (currency) return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString("pt-BR");
}

const DATE_LABEL: Record<string, string> = {
  today: "Hoje",
  last_7d: "Últimos 7 dias",
  last_30d: "Últimos 30 dias",
  last_90d: "Últimos 90 dias",
};

export function CampaignReportPDF({ accountName, datePreset, insights, adsInsights, aiSuggestion }: Props) {
  const top5 = adsInsights.slice(0, 5);
  const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Document title={`Relatório Sz Ads — ${accountName}`} author="Sz Ads">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Relatório de Performance</Text>
          <Text style={s.subtitle}>
            {accountName} · {DATE_LABEL[datePreset] ?? datePreset} · Gerado em {now}
          </Text>
        </View>

        {/* KPIs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Métricas principais</Text>
          <View style={s.row}>
            <View style={s.card}>
              <Text style={s.cardLabel}>Impressões</Text>
              <Text style={s.cardValue}>{fmt(insights.impressions)}</Text>
              <Text style={s.cardSub}>CPM {fmt(insights.cpm, true)}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>Cliques</Text>
              <Text style={s.cardValue}>{fmt(insights.clicks)}</Text>
              <Text style={s.cardSub}>CTR {insights.ctr ? parseFloat(insights.ctr).toFixed(2) + "%" : "—"}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>Gasto total</Text>
              <Text style={s.cardValue}>{fmt(insights.spend, true)}</Text>
              <Text style={s.cardSub}>CPC {fmt(insights.cpc, true)}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>Alcance</Text>
              <Text style={s.cardValue}>{fmt(insights.reach)}</Text>
            </View>
          </View>
        </View>

        {/* Top ads */}
        {top5.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Top anúncios por gasto</Text>
            <View style={s.table}>
              <View style={s.tableHead}>
                <Text style={s.tableCellBold}>Anúncio</Text>
                <Text style={s.tableCell}>Gasto</Text>
                <Text style={s.tableCell}>Cliques</Text>
                <Text style={s.tableCell}>CTR</Text>
              </View>
              {top5.map((ad, i) => (
                <View key={i} style={s.tableRow}>
                  <Text style={s.tableCellBold}>{ad.ad_name ?? `Anúncio ${i + 1}`}</Text>
                  <Text style={s.tableCell}>{fmt(ad.spend, true)}</Text>
                  <Text style={s.tableCell}>{fmt(ad.clicks)}</Text>
                  <Text style={s.tableCell}>{ad.ctr ? parseFloat(ad.ctr).toFixed(2) + "%" : "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI suggestion */}
        {aiSuggestion && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recomendação da IA</Text>
            <View style={s.aiBox}>
              <Text style={s.aiText}>{aiSuggestion.replace(/[*#`|]/g, "").trim()}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Sz Ads · szads.com.br</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
