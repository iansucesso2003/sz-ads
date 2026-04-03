"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Users } from "lucide-react";
import Link from "next/link";

export default function ConvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [orgId, setOrgId] = useState("");

  useEffect(() => {
    fetch(`/api/invitations/${token}/accept`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setStatus("error"); setMessage(d.error); }
        else { setStatus("success"); setOrgId(d.organizationId); }
      })
      .catch(() => { setStatus("error"); setMessage("Erro ao aceitar convite."); });
  }, [token]);

  useEffect(() => {
    if (status === "success" && orgId) {
      document.cookie = `org-id=${orgId}; path=/; max-age=${60 * 60 * 24 * 30}`;
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }, [status, orgId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B]">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/4 p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-400" />
            <p className="text-sm text-white/70">Aceitando convite...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
            <h1 className="mb-2 text-lg font-semibold text-white">Bem-vindo!</h1>
            <p className="text-sm text-white/60">Você entrou na organização. Redirecionando...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
            <h1 className="mb-2 text-lg font-semibold text-white">Convite inválido</h1>
            <p className="mb-6 text-sm text-white/60">{message}</p>
            <Link href="/login">
              <button type="button" className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
                Ir para o login
              </button>
            </Link>
          </>
        )}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-white/30">
          <Users className="h-3 w-3" />
          Sz Ads
        </div>
      </div>
    </div>
  );
}
