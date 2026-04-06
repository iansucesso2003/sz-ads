"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Loader2, Plus, Trash2 } from "lucide-react";

interface Channel {
  id: string;
  platform: string;
  adAccountId?: string | null;
  accountName?: string | null;
  customerId?: string | null;
}

export default function EditarProjetoPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [projectName, setProjectName] = useState("");

  // Meta form
  const [metaAccountId, setMetaAccountId] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [metaName, setMetaName] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  // Google form
  const [googleCustomerId, setGoogleCustomerId] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [savingGoogle, setSavingGoogle] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      fetch(`/api/ad-accounts/${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/channels`).then((r) => r.json()),
    ]).then(([proj, chs]) => {
      setProjectName(proj.accountName || "");
      const chList: Channel[] = Array.isArray(chs) ? chs : [];
      setChannels(chList);
      const meta = chList.find((c) => c.platform === "META");
      if (meta) { setMetaAccountId(meta.adAccountId || ""); setMetaName(meta.accountName || ""); }
      const google = chList.find((c) => c.platform === "GOOGLE");
      if (google) { setGoogleCustomerId(google.customerId || ""); setGoogleName(google.accountName || ""); }
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId]);

  async function saveChannel(platform: "META" | "GOOGLE") {
    setError("");
    if (platform === "META") setSavingMeta(true);
    else setSavingGoogle(true);

    try {
      const body = platform === "META"
        ? { platform, adAccountId: metaAccountId.trim(), accessToken: metaToken.trim(), accountName: metaName.trim() || undefined }
        : { platform, customerId: googleCustomerId.trim(), refreshToken: googleRefreshToken.trim(), accountName: googleName.trim() || undefined };

      const res = await fetch(`/api/projects/${projectId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
      router.push(`/dashboard/projeto/${projectId}`);
    } catch (e) { setError((e as Error).message); }
    finally { setSavingMeta(false); setSavingGoogle(false); }
  }

  async function removeChannel(platform: string) {
    if (!confirm(`Remover canal ${platform}?`)) return;
    await fetch(`/api/projects/${projectId}/channels`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    setChannels((prev) => prev.filter((c) => c.platform !== platform));
  }

  const hasMeta = channels.some((c) => c.platform === "META");
  const hasGoogle = channels.some((c) => c.platform === "GOOGLE");

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white/40" /></div>;

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Settings2 className="h-5 w-5" />
          {projectName || "Projeto"}
        </h1>

        {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">{error}</p>}

        {/* META channel */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-xs font-bold">M</span>
                Meta Ads
              </span>
              {hasMeta && (
                <button type="button" onClick={() => removeChannel("META")} className="text-white/30 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </CardTitle>
            <CardDescription className="text-white/60">
              {hasMeta ? "Atualizar credenciais do Meta Ads" : "Conectar Meta Ads a este projeto"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80">ID da conta</Label>
              <Input placeholder="act_123456789" value={metaAccountId} onChange={(e) => setMetaAccountId(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Nome (opcional)</Label>
              <Input placeholder="Nome do projeto" value={metaName} onChange={(e) => setMetaName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Access Token {hasMeta && <span className="text-white/40 text-xs">(deixe em branco para manter o atual)</span>}</Label>
              <Input type="password" placeholder={hasMeta ? "Novo token (opcional)" : "Token de acesso da Meta"} value={metaToken} onChange={(e) => setMetaToken(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              <p className="text-xs text-white/40">developers.facebook.com → Graph API Explorer</p>
            </div>
            <Button onClick={() => saveChannel("META")} disabled={!metaAccountId.trim() || (!hasMeta && !metaToken.trim()) || savingMeta} className="flex items-center gap-2">
              {savingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {hasMeta ? "Atualizar Meta" : "Conectar Meta"}
            </Button>
          </CardContent>
        </Card>

        {/* GOOGLE channel */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-red-600 text-xs font-bold">G</span>
                Google Ads
              </span>
              {hasGoogle && (
                <button type="button" onClick={() => removeChannel("GOOGLE")} className="text-white/30 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </CardTitle>
            <CardDescription className="text-white/60">
              {hasGoogle ? "Atualizar credenciais do Google Ads" : "Conectar Google Ads a este projeto"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasGoogle && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                Requer Developer Token aprovado pelo Google e OAuth Refresh Token configurados nas variáveis de ambiente.
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-white/80">Customer ID</Label>
              <Input placeholder="123-456-7890" value={googleCustomerId} onChange={(e) => setGoogleCustomerId(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Nome (opcional)</Label>
              <Input placeholder="Nome do projeto" value={googleName} onChange={(e) => setGoogleName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Refresh Token</Label>
              <Input type="password" placeholder={hasGoogle ? "Novo token (opcional)" : "OAuth 2.0 Refresh Token"} value={googleRefreshToken} onChange={(e) => setGoogleRefreshToken(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <Button onClick={() => saveChannel("GOOGLE")} disabled={!googleCustomerId.trim() || (!hasGoogle && !googleRefreshToken.trim()) || savingGoogle} className="flex items-center gap-2">
              {savingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {hasGoogle ? "Atualizar Google" : "Conectar Google"}
            </Button>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => router.push(`/dashboard/projeto/${projectId}`)}>
          Voltar ao projeto
        </Button>
      </div>
    </div>
  );
}
