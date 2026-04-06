import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type Delta, formatDelta, COST_METRICS } from "@/lib/snapshot";

interface DeltaBadgeProps {
  delta: Delta | null;
  metric?: string; // se for métrica de custo, inverte o verde/vermelho
  className?: string;
}

export function DeltaBadge({ delta, metric, className = "" }: DeltaBadgeProps) {
  if (!delta || delta.direction === "flat") {
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs text-white/30 ${className}`}>
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }

  const isCost = metric ? COST_METRICS.has(metric) : false;
  const isGood = isCost ? delta.direction === "down" : delta.direction === "up";

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      isGood ? "text-emerald-400" : "text-red-400"
    } ${className}`}>
      {delta.direction === "up"
        ? <TrendingUp className="h-3 w-3" />
        : <TrendingDown className="h-3 w-3" />
      }
      {formatDelta(delta)}
    </span>
  );
}
