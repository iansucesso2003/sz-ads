"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

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

interface ExportPDFButtonProps {
  accountName: string;
  datePreset: string;
  insights: Insights;
  adsInsights: AdInsight[];
  aiSuggestion?: string;
}

export function ExportPDFButton({ accountName, datePreset, insights, adsInsights, aiSuggestion }: ExportPDFButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { CampaignReportPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf/campaign-report"),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(CampaignReportPDF({ accountName, datePreset, insights, adsInsights, aiSuggestion }) as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-sz-ads-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Exportar PDF
    </button>
  );
}
