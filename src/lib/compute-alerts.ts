export type AlertSeverity = "warning" | "critical";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
}

export interface AlertThresholds {
  cpmMax: number;
  cpcMax: number;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  cpmMax: 50,
  cpcMax: 5,
};

interface Insights {
  cpm?: string;
  cpc?: string;
  spend?: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  daily_budget?: string;
}

export function computeAlerts(
  insights: Insights,
  campaigns: Campaign[],
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Alert[] {
  const alerts: Alert[] = [];

  const cpm = parseFloat(insights.cpm || "0");
  const cpc = parseFloat(insights.cpc || "0");

  if (cpm > thresholds.cpmMax && cpm > 0) {
    alerts.push({
      id: "cpm-high",
      severity: cpm > thresholds.cpmMax * 1.5 ? "critical" : "warning",
      title: "CPM elevado",
      description: `CPM atual de R$${cpm.toFixed(2)} está acima do limite de R$${thresholds.cpmMax.toFixed(2)}. Considere revisar o público ou criativos.`,
    });
  }

  if (cpc > thresholds.cpcMax && cpc > 0) {
    alerts.push({
      id: "cpc-high",
      severity: cpc > thresholds.cpcMax * 1.5 ? "critical" : "warning",
      title: "CPC elevado",
      description: `CPC atual de R$${cpc.toFixed(2)} está acima do limite de R$${thresholds.cpcMax.toFixed(2)}. Verifique a relevância dos anúncios.`,
    });
  }

  const pausedUnexpectedly = campaigns.filter(
    (c) => c.effective_status === "PAUSED" && c.status === "ACTIVE"
  );
  for (const c of pausedUnexpectedly) {
    alerts.push({
      id: `paused-${c.id}`,
      severity: "critical",
      title: `Campanha pausada inesperadamente`,
      description: `"${c.name}" está ativa mas foi pausada pelo sistema. Verifique o orçamento ou políticas.`,
    });
  }

  const spend = parseFloat(insights.spend || "0");
  for (const c of campaigns) {
    if (c.daily_budget) {
      const budget = parseFloat(c.daily_budget) / 100;
      if (budget > 0 && spend >= budget * 0.85) {
        alerts.push({
          id: `budget-${c.id}`,
          severity: "warning",
          title: "Orçamento próximo do limite",
          description: `"${c.name}" está com ${Math.round((spend / budget) * 100)}% do orçamento diário utilizado.`,
        });
      }
    }
  }

  return alerts;
}
