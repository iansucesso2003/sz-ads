"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AdInsight {
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  clicks?: string;
  impressions?: string;
  ctr?: string;
}

interface AdsSpendChartProps {
  data: AdInsight[];
}

const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f87171"];

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: AdInsight & { spendNum: number } }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0f0f1a] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-white">{d.ad_name || "Anúncio"}</p>
      <p className="text-emerald-400">Gasto: R$ {d.spendNum.toFixed(2)}</p>
      {d.clicks && <p className="text-violet-400">Cliques: {parseInt(d.clicks).toLocaleString("pt-BR")}</p>}
      {d.ctr && <p className="text-blue-400">CTR: {parseFloat(d.ctr).toFixed(2)}%</p>}
    </div>
  );
};

export function AdsSpendChart({ data }: AdsSpendChartProps) {
  const chartData = data
    .filter((d) => parseFloat(d.spend || "0") > 0)
    .sort((a, b) => parseFloat(b.spend || "0") - parseFloat(a.spend || "0"))
    .slice(0, 6)
    .map((d) => ({
      ...d,
      name: truncate(d.ad_name || d.ad_id || "Anúncio", 22),
      spendNum: parseFloat(d.spend || "0"),
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-white/30">
        Sem dados de gasto no período selecionado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${v}`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="spendNum" radius={[6, 6, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
