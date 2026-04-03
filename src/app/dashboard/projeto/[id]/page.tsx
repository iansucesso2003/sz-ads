"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";
import { Megaphone, Target, ImageIcon, BarChart3, Palette, Settings2, Filter, Eye, MousePointer2, DollarSign, Users, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdsSpendChart } from "@/components/ui/ads-spend-chart";
import { PerformanceHistoryChart } from "@/components/ui/performance-history-chart";
import { AlertBanner } from "@/components/ui/alert-banner";
import { computeAlerts } from "@/lib/compute-alerts";
import { ExportPDFButton } from "@/components/ui/export-pdf-button";

interface Campaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
}

interface AdSet {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
}

interface Ad {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  created_time?: string;
}

interface Creative {
  id: string;
  name?: string;
  title?: string;
  body?: string;
  image_url?: string;
  thumbnail_url?: string;
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

function formatNumber(val: string | undefined): string {
  if (!val) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString("pt-BR");
}

function formatCurrency(val: string | undefined): string {
  if (!val) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

const DATE_PRESETS = [
  { value: "today", label: "Hoje" },
  { value: "last_7d", label: "Últimos 7 dias" },
  { value: "last_30d", label: "Últimos 30 dias" },
  { value: "last_90d", label: "Últimos 90 dias" },
] as const;

export default function ProjetoPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adsets, setAdsets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [insights, setInsights] = useState<Insights>({});
  const [adsInsights, setAdsInsights] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [datePreset, setDatePreset] = useState("last_7d");

  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    Promise.allSettled([
      fetch(`/api/meta/${projectId}/campaigns`).then((r) => r.json()),
      fetch(`/api/meta/${projectId}/adsets`).then((r) => r.json()),
      fetch(`/api/meta/${projectId}/ads`).then((r) => r.json()),
      fetch(`/api/meta/${projectId}/creatives`).then((r) => r.json()),
      fetch(`/api/meta/${projectId}/insights?date_preset=${datePreset}`).then((r) => r.json()),
      fetch(`/api/meta/${projectId}/ads-insights?date_preset=${datePreset}`).then((r) => r.json()),
    ]).then(([camp, adset, ad, creatives, insights, adsIns]) => {
      const campData = camp.status === "fulfilled" ? camp.value : { error: "Erro" };
      const adsetData = adset.status === "fulfilled" ? adset.value : { error: "Erro" };
      const adData = ad.status === "fulfilled" ? ad.value : { error: "Erro" };
      const creativesData = creatives.status === "fulfilled" ? creatives.value : { error: "Erro" };
      const insightsData = insights.status === "fulfilled" ? insights.value : { error: "Erro" };
      const adsInsData = adsIns.status === "fulfilled" ? adsIns.value : { error: "Erro" };

      if (campData.error) setError(campData.error);
      else {
        setCampaigns(Array.isArray(campData) ? campData : []);
        setAdsets(Array.isArray(adsetData) ? adsetData : adsetData.error ? [] : []);
        setAds(Array.isArray(adData) ? adData : adData.error ? [] : []);
        setCreatives(Array.isArray(creativesData) ? creativesData : creativesData.error ? [] : []);
        setInsights(insightsData.error ? {} : insightsData);
        setAdsInsights(Array.isArray(adsInsData) ? adsInsData : adsInsData.error ? [] : []);
      }
    }).catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId, datePreset]);

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-white/10 p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-40" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/8 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/8 p-4 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    const isTokenError =
      /expired|invalid.*token|access token|session has expired/i.test(error);

    return (
      <div className="p-6">
        <p className="text-red-400">{error}</p>
        <p className="mt-2 text-sm text-white/50">
          {isTokenError
            ? "Gere um novo Access Token no Graph API Explorer e atualize as credenciais do projeto."
            : "Verifique se o Access Token está válido e tem as permissões necessárias."}
        </p>
        {isTokenError && (
          <Link href={`/dashboard/projeto/${projectId}/editar`} className="mt-4 inline-block">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Settings2 className="h-4 w-4" />
              Editar integração
            </button>
          </Link>
        )}
      </div>
    );
  }

  const alerts = computeAlerts(insights, campaigns);

  return (
    <div className="flex h-full flex-col">
      {/* Métricas da conta */}
      <div className="shrink-0 border-b border-white/10 p-6">
        <div className="mx-auto max-w-4xl">
          {alerts.length > 0 && (
            <div className="mb-4">
              <AlertBanner alerts={alerts} />
            </div>
          )}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-lg font-medium text-white">
              <BarChart3 className="h-5 w-5" />
              Métricas
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-white/50" />
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
                >
                {DATE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#0A0A0B] text-white">
                    {p.label}
                  </option>
                ))}
                </select>
              </div>
              <ExportPDFButton
                accountName={projectId}
                datePreset={datePreset}
                insights={insights}
                adsInsights={adsInsights as Parameters<typeof ExportPDFButton>[0]["adsInsights"]}
              />
              <Link href={`/dashboard/projeto/${projectId}/editar`}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Settings2 className="h-4 w-4" />
                  Editar integração
                </button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-blue-300/70">Impressões</p>
                <div className="rounded-md bg-blue-500/20 p-1.5">
                  <Eye className="h-3.5 w-3.5 text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(insights.impressions)}</p>
              {insights.cpm && (
                <p className="mt-1 flex items-center gap-1 text-xs text-blue-300/60">
                  <TrendingUp className="h-3 w-3" /> CPM {formatCurrency(insights.cpm)}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-violet-300/70">Cliques</p>
                <div className="rounded-md bg-violet-500/20 p-1.5">
                  <MousePointer2 className="h-3.5 w-3.5 text-violet-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(insights.clicks)}</p>
              {insights.ctr && (
                <p className="mt-1 flex items-center gap-1 text-xs text-violet-300/60">
                  <TrendingUp className="h-3 w-3" /> CTR {parseFloat(insights.ctr).toFixed(2)}%
                </p>
              )}
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-emerald-300/70">Gasto</p>
                <div className="rounded-md bg-emerald-500/20 p-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(insights.spend)}</p>
              {insights.cpc && (
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-300/60">
                  <TrendingDown className="h-3 w-3" /> CPC {formatCurrency(insights.cpc)}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-amber-300/70">Alcance</p>
                <div className="rounded-md bg-amber-500/20 p-1.5">
                  <Users className="h-3.5 w-3.5 text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(insights.reach)}</p>
            </div>
          </div>

          {/* Campanhas, Conjuntos, Anúncios, Criativos */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-white/8 bg-white/4 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/70">
                  <Megaphone className="h-4 w-4 text-blue-400" />
                  Campanhas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{campaigns.length}</p>
                <p className="text-xs text-white/40">ativas</p>
              </CardContent>
            </Card>
            <Card className="border-white/8 bg-white/4 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/70">
                  <Target className="h-4 w-4 text-violet-400" />
                  Conjuntos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{adsets.length}</p>
                <p className="text-xs text-white/40">ativos</p>
              </CardContent>
            </Card>
            <Card className="border-white/8 bg-white/4 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/70">
                  <ImageIcon className="h-4 w-4 text-emerald-400" />
                  Anúncios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{ads.length}</p>
                <p className="text-xs text-white/40">ativos</p>
              </CardContent>
            </Card>
            <Card className="border-white/8 bg-white/4 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/70">
                  <Palette className="h-4 w-4 text-amber-400" />
                  Criativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{creatives.length}</p>
                <p className="text-xs text-white/40">ativos</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Gráfico top anúncios */}
      {adsInsights.length > 0 && (
        <div className="shrink-0 border-b border-white/10 px-6 py-4">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Top anúncios por gasto
            </p>
            <AdsSpendChart data={adsInsights as Parameters<typeof AdsSpendChart>[0]["data"]} />
          </div>
        </div>
      )}

      {/* Histórico de performance */}
      <div className="shrink-0 border-b border-white/10 px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <PerformanceHistoryChart projectId={projectId} />
        </div>
      </div>

      {/* Chat com o agente */}
      <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
        <AnimatedAIChat
          projectId={projectId}
          datePreset={datePreset}
        />
      </div>
    </div>
  );
}
