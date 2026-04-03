"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Megaphone } from "lucide-react";

export default function NovoProjetoPage() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [accountName, setAccountName] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!adAccountId.trim() || !accessToken.trim()) {
      setError("Preencha o ID da conta e o Access Token");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/ad-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId: adAccountId.trim(),
          accessToken: accessToken.trim(),
          accountName: accountName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao conectar");
      router.refresh();
      router.push(`/dashboard/projeto/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-xl">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Megaphone className="h-5 w-5" />
              Adicionar projeto
            </CardTitle>
            <CardDescription className="text-white/60">
              Conecte uma conta de anúncios Meta. A integração é feita por projeto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adAccountId" className="text-white/80">
                  ID da conta de anúncios
                </Label>
                <Input
                  id="adAccountId"
                  placeholder="act_123456789 ou 123456789"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
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
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessToken" className="text-white/80">
                  Access Token
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Token de acesso da Meta"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-white/40">
                  developers.facebook.com → Ferramentas → Graph API Explorer
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={adding}>
                  {adding ? "Conectando..." : "Conectar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Voltar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
