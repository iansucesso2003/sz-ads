import Link from "next/link";
import { Eye, MousePointer2, DollarSign, Users, TrendingUp, TrendingDown, BarChart3, Megaphone, Target, ImageIcon, Palette, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdsSpendChart } from "@/components/ui/ads-spend-chart";
import { PerformanceHistoryChart } from "@/components/ui/performance-history-chart";
import { AlertBanner } from "@/components/ui/alert-banner";
import { DemoAIChat } from "@/components/ui/demo-ai-chat";
import { DEMO_INSIGHTS, DEMO_ADS_INSIGHTS, DEMO_HISTORY, DEMO_CAMPAIGNS } from "@/lib/demo-data";
import { computeAlerts } from "@/lib/compute-alerts";

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

const DEMO_ALERTS = computeAlerts(DEMO_INSIGHTS, DEMO_CAMPAIGNS);

export default function DemoPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0B] flex-col">
      {/* CTA banner */}
      <div className="shrink-0 border-b border-blue-500/20 bg-blue-500/10 px-6 py-2.5 flex items-center justify-between gap-4">
        <p className="text-sm text-blue-200">
          <span className="font-semibold">Modo demonstração</span> — dados fictícios para ilustrar o painel.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/login">
            <button type="button" className="rounded-lg border border-blue-400/30 px-3 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-500/20 transition-colors">
              Entrar
            </button>
          </Link>
          <Link href="/registro">
            <button type="button" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Criar conta grátis
            </button>
          </Link>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — metrics + chart */}
        <div className="flex-1 overflow-y-auto border-r border-white/10">
          <div className="p-6 space-y-6">
            {/* Alerts */}
            {DEMO_ALERTS.length > 0 && <AlertBanner alerts={DEMO_ALERTS} />}

            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-medium text-white">
                <BarChart3 className="h-5 w-5" />
                Métricas — Últimos 7 dias
              </h2>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300">
                Demo
              </span>
            </div>

            {/* Main metric cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-blue-300/70">Impressões</p>
                  <div className="rounded-md bg-blue-500/20 p-1.5">
                    <Eye className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(DEMO_INSIGHTS.impressions)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-blue-300/60">
                  <TrendingUp className="h-3 w-3" /> CPM {formatCurrency(DEMO_INSIGHTS.cpm)}
                </p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-violet-300/70">Cliques</p>
                  <div className="rounded-md bg-violet-500/20 p-1.5">
                    <MousePointer2 className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(DEMO_INSIGHTS.clicks)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-violet-300/60">
                  <TrendingUp className="h-3 w-3" /> CTR {parseFloat(DEMO_INSIGHTS.ctr).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-emerald-300/70">Gasto</p>
                  <div className="rounded-md bg-emerald-500/20 p-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(DEMO_INSIGHTS.spend)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-300/60">
                  <TrendingDown className="h-3 w-3" /> CPC {formatCurrency(DEMO_INSIGHTS.cpc)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-amber-300/70">Alcance</p>
                  <div className="rounded-md bg-amber-500/20 p-1.5">
                    <Users className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(DEMO_INSIGHTS.reach)}</p>
              </div>
            </div>

            {/* Count cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-white/8 bg-white/4 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <Megaphone className="h-4 w-4 text-blue-400" />
                    Campanhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">3</p>
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
                  <p className="text-3xl font-bold text-white">8</p>
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
                  <p className="text-3xl font-bold text-white">6</p>
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
                  <p className="text-3xl font-bold text-white">6</p>
                  <p className="text-xs text-white/40">ativos</p>
                </CardContent>
              </Card>
            </div>

            {/* Top ads chart */}
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                Top anúncios por gasto
              </p>
              <AdsSpendChart data={DEMO_ADS_INSIGHTS as Parameters<typeof AdsSpendChart>[0]["data"]} />
            </div>

            {/* History chart */}
            <div className="rounded-xl border border-white/8 bg-white/4 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Histórico de performance
              </p>
              <PerformanceHistoryChart projectId="demo" staticData={DEMO_HISTORY} />
            </div>
          </div>
        </div>

        {/* Right panel — AI chat */}
        <div className="w-[420px] shrink-0 flex flex-col">
          <DemoAIChat />
        </div>
      </div>
    </div>
  );
}
