"use client";

import { useState, useEffect } from "react";
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

interface Org {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function OrganizacaoPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((data: Org[]) => {
        // Auto-select if only one org
        if (data.length === 1) {
          document.cookie = `org-id=${data[0].id}; path=/; max-age=${60 * 60 * 24 * 30}`;
          router.push("/dashboard");
          return;
        }
        setOrgs(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSelect(orgId: string) {
    document.cookie = `org-id=${orgId}; path=/; max-age=${60 * 60 * 24 * 30}`;
    router.push("/dashboard");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      document.cookie = `org-id=${data.id}; path=/; max-age=${60 * 60 * 24 * 30}`;
      router.push("/dashboard");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] p-4">
      <Card className="w-full max-w-md border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Escolha sua organização</CardTitle>
          <CardDescription className="text-white/60">
            Selecione uma workspace ou crie uma nova
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-white/60">Carregando...</p>
          ) : (
            <div className="space-y-2">
              {orgs.map((org) => (
                <Button
                  key={org.id}
                  variant="outline"
                  className="w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => handleSelect(org.id)}
                >
                  {org.name}
                </Button>
              ))}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-2 border-t border-white/10 pt-4">
            <Label className="text-white/80">Criar nova organização</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da empresa"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? "..." : "Criar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
