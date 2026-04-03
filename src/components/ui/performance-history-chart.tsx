"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoryPoint {
  date_start: string;
  spend?: string;
  clicks?: string;
  impressions?: string;
}

type Metric = "spend" | "clicks" | "impressions";
type Days = 7 | 30;

const METRIC_CONFIG: Record<Metric, { label: string; color: string; format: (v: number) => string }> = {
  spend: { label: "Gasto (R$)", color: "#34d399", format: (v) => `R$${v.toFixed(2)}` },
  clicks: { label: "Cliques", color: "#a78bfa", format: (v) => v.toLocaleString("pt-BR") },
  impressions: { label: "Impressões", color: "#60a5fa", format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v) },
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const metric = Object.keys(METRIC_CONFIG).find(k => METRIC_CONFIG[k as Metric].label === payload[0]?.name) as Metric;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0f0f1a] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-white/50">{label}</p>
      <p style={{ color: METRIC_CONFIG[metric]?.color }}>
        {METRIC_CONFIG[metric]?.format(payload[0].value)}
      </p>
    </div>
  );
};

interface PerformanceHistoryChartProps {
  projectId: string;
  staticData?: HistoryPoint[];
}

export function PerformanceHistoryChart({ projectId, staticData }: PerformanceHistoryChartProps) {
  const [days, setDays] = useState<Days>(7);
  const [metric, setMetric] = useState<Metric>("spend");
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(!staticData);

  useEffect(() => {
    if (staticData) {
      setData(staticData);
      return;
    }
    setLoading(true);
    fetch(`/api/meta/${projectId}/history?days=${days}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [projectId, days, staticData]);

  const chartData = data.map((d) => ({
    date: new Date(d.date_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    value: parseFloat(d[metric] || "0"),
  }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["spend", "clicks", "impressions"] as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                metric === m
                  ? "text-white font-medium"
                  : "text-white/40 hover:text-white/70"
              }`}
              style={metric === m ? { backgroundColor: METRIC_CONFIG[m].color + "25", color: METRIC_CONFIG[m].color } : {}}
            >
              {METRIC_CONFIG[m].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {([7, 30] as Days[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                days === d
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[180px] w-full rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-white/30">
          Sem dados no período selecionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={44}
              tickFormatter={(v) => metric === "spend" ? `R$${v}` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              name={METRIC_CONFIG[metric].label}
              stroke={METRIC_CONFIG[metric].color}
              strokeWidth={2}
              dot={{ fill: METRIC_CONFIG[metric].color, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
