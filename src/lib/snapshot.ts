export interface SnapshotMetrics {
  impressions: number | null;
  clicks: number | null;
  spend: number | null;
  reach: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
}

export interface Delta {
  value: number;      // percentual de variação
  direction: "up" | "down" | "flat";
}

// Calcula variação percentual entre dois valores
export function calcDelta(current: number | null | undefined, previous: number | null | undefined): Delta | null {
  if (current == null || previous == null || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.5) return { value: 0, direction: "flat" };
  return { value: pct, direction: pct > 0 ? "up" : "down" };
}

// Formata delta para exibição: "+12,3%" ou "-5,1%"
export function formatDelta(delta: Delta): string {
  const abs = Math.abs(delta.value).toFixed(1);
  return delta.direction === "up" ? `+${abs}%` : `-${abs}%`;
}

// Para métricas onde "subir é ruim" (custo)
export const COST_METRICS = new Set(["cpc", "cpm", "spend"]);
