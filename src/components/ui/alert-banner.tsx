"use client";

import { useState } from "react";
import { AlertTriangle, XCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/compute-alerts";

interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const criticals = visible.filter((a) => a.severity === "critical");
  const warnings = visible.filter((a) => a.severity === "warning");

  return (
    <div className="mb-4 rounded-xl border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/8 transition-colors"
      >
        <div className="flex items-center gap-2">
          {criticals.length > 0 ? (
            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          )}
          <span className="text-sm font-medium text-white">
            {visible.length} alerta{visible.length > 1 ? "s" : ""} detectado{visible.length > 1 ? "s" : ""}
          </span>
          {criticals.length > 0 && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
              {criticals.length} crítico{criticals.length > 1 ? "s" : ""}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
              {warnings.length} aviso{warnings.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-white/40" />
        ) : (
          <ChevronUp className="h-4 w-4 text-white/40" />
        )}
      </button>

      {!collapsed && (
        <div className="divide-y divide-white/5">
          {visible.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3",
                alert.severity === "critical"
                  ? "bg-red-500/8"
                  : "bg-amber-500/8"
              )}
            >
              {alert.severity === "critical" ? (
                <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  alert.severity === "critical" ? "text-red-300" : "text-amber-300"
                )}>
                  {alert.title}
                </p>
                <p className="text-xs text-white/50 mt-0.5">{alert.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setDismissed((d) => new Set([...d, alert.id]))}
                className="shrink-0 rounded p-1 text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
