"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings2, Loader2 } from "lucide-react";

export default function EditarIntegracaoPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/ad-accounts/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setAdAccountId(data.adAccountId || "");
        setAccountName(data.accountName || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!adAccountId.trim() || !accessToken.trim()) {
      setError("Preencha o ID da conta e o Access Token");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/ad-accounts/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId: adAccountId.trim(),
          accessToken: accessToken.trim(),
          accountName: accountName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar");
      router.refresh();
      router.push(`/dashboard/projeto/${projectId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-xl">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings2 className="h-5 w-5" />
              Editar integração
            </CardTitle>
            <CardDescription className="text-white/60">
              Atualize as credenciais da conta de anúncios Meta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adAccountId" className="text-white/80">
                  ID da conta de anúncios
                </Label>
                <Input
                  id="adAccountId"
                  placeholder="act_123456789 ou 123456789"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  className="border-white/10 bg-white/5 text-white"
                />
                <p className="text-xs text-white/40">
                  Gerenciador de Anúncios → Configurações da conta
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-white/80">
                  Nome do projeto (opcional)
                </Label>
                <Input
                  id="accountName"
                  placeholder="Ex: Sz Technology"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessToken" className="text-white/80">
                  Access Token
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Novo token de acesso (obrigatório)"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="border-white/10 bg-white/5 text-white"
                />
                <p className="text-xs text-white/40">
                  developers.facebook.com → Ferramentas → Graph API Explorer
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/projeto/${projectId}`)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
