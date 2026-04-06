"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderKanban, ChevronRight, Check } from "lucide-react";

type Step = "name" | "channels" | "meta" | "google";

export default function NovoProjetoPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<Set<"META" | "GOOGLE">>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Meta fields
  const [adAccountId, setAdAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  // Google fields
  const [customerId, setCustomerId] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  async function createProject() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProjectId(data.id);
      setStep("channels");
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function connectChannel(platform: "META" | "GOOGLE") {
    setLoading(true); setError("");
    try {
      const body = platform === "META"
        ? { platform, adAccountId, accessToken }
        : { platform, customerId, refreshToken };

      const res = await fetch(`/api/projects/${projectId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setChannels((prev) => new Set([...prev, platform]));

      // Se ainda tem Google para configurar
      if (platform === "META" && channels.has("GOOGLE") === false && step === "meta") {
        setStep("google");
      } else {
        router.push(`/dashboard/projeto/${projectId}`);
        router.refresh();
      }
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-xl space-y-6">

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm text-white/40">
          {[
            { key: "name", label: "Nome" },
            { key: "channels", label: "Canais" },
            { key: "meta", label: "Meta Ads" },
            { key: "google", label: "Google Ads" },
          ].map((s, i, arr) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className={step === s.key ? "text-white font-medium" : ""}>
                {s.label}
              </span>
              {i < arr.length - 1 && <ChevronRight className="h-3 w-3" />}
            </span>
          ))}
        </div>

        {/* Step 1: Nome */}
        {step === "name" && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FolderKanban className="h-5 w-5" />
                Nome do projeto
              </CardTitle>
              <CardDescription className="text-white/60">
                Ex: "Loja XYZ", "Marca Principal", "Cliente ABC"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Nome</Label>
                <Input
                  placeholder="Nome do projeto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && createProject()}
                  className="bg-white/5 border-white/10 text-white"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={createProject} disabled={!name.trim() || loading}>
                  {loading ? "Criando..." : "Continuar"}
                </Button>
                <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Escolher canais */}
        {step === "channels" && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Quais canais quer conectar?</CardTitle>
              <CardDescription className="text-white/60">
                Selecione um ou os dois. Você pode adicionar mais depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["META", "GOOGLE"] as const).map((platform) => {
                const selected = channels.has(platform);
                const label = platform === "META" ? "Meta Ads (Facebook / Instagram)" : "Google Ads";
                const desc = platform === "META"
                  ? "Conecte via Account ID + Access Token"
                  : "Conecte via Customer ID + Refresh Token";
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setChannels((prev) => {
                      const next = new Set(prev);
                      selected ? next.delete(platform) : next.add(platform);
                      return next;
                    })}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${selected ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/3 hover:bg-white/6"}`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${platform === "META" ? "bg-blue-600" : "bg-red-600"}`}>
                      {platform === "META" ? "M" : "G"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-white/40">{desc}</p>
                    </div>
                    {selected && <Check className="h-4 w-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => {
                    if (channels.has("META")) setStep("meta");
                    else if (channels.has("GOOGLE")) setStep("google");
                  }}
                  disabled={channels.size === 0}
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Meta Ads */}
        {step === "meta" && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-xs font-bold">M</span>
                Conectar Meta Ads
              </CardTitle>
              <CardDescription className="text-white/60">
                Conta de anúncios do Facebook / Instagram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">ID da conta de anúncios</Label>
                <Input placeholder="act_123456789 ou 123456789" value={adAccountId} onChange={(e) => setAdAccountId(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                <p className="text-xs text-white/40">Gerenciador de Anúncios → Configurações da conta</p>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Access Token</Label>
                <Input type="password" placeholder="Token de acesso da Meta" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                <p className="text-xs text-white/40">developers.facebook.com → Ferramentas → Graph API Explorer</p>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={() => connectChannel("META")} disabled={!adAccountId.trim() || !accessToken.trim() || loading}>
                  {loading ? "Conectando..." : "Conectar Meta"}
                </Button>
                <Button variant="outline" onClick={() => setStep("channels")}>Voltar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Google Ads */}
        {step === "google" && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-red-600 text-xs font-bold">G</span>
                Conectar Google Ads
              </CardTitle>
              <CardDescription className="text-white/60">
                Conta Google Ads (Customer ID + Refresh Token)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                Você precisa de um <strong>Developer Token</strong> aprovado pelo Google e de um <strong>OAuth Refresh Token</strong>. Configure nas variáveis de ambiente antes de conectar.
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Customer ID</Label>
                <Input placeholder="123-456-7890" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                <p className="text-xs text-white/40">Google Ads → Configurações da conta</p>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Refresh Token</Label>
                <Input type="password" placeholder="Refresh Token OAuth 2.0" value={refreshToken} onChange={(e) => setRefreshToken(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={() => connectChannel("GOOGLE")} disabled={!customerId.trim() || !refreshToken.trim() || loading}>
                  {loading ? "Conectando..." : "Conectar Google"}
                </Button>
                <Button variant="outline" onClick={() => router.push(`/dashboard/projeto/${projectId}`)}>
                  Pular por agora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
