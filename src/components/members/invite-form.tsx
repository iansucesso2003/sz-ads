"use client";

import { useState } from "react";
import { Send, Copy, Check, Loader2 } from "lucide-react";

interface InviteFormProps {
  orgId: string;
  onInvited?: () => void;
}

export function InviteForm({ orgId, onInvited }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInviteUrl("");
    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setInviteUrl(data.inviteUrl);
      setEmail("");
      onInvited?.();
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/4 p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">Convidar membro</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
          >
            <option value="member" className="bg-[#0A0A0B]">Membro</option>
            <option value="admin" className="bg-[#0A0A0B]">Admin</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Convidar
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>

      {inviteUrl && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2.5">
          <p className="flex-1 truncate text-xs text-blue-200">{inviteUrl}</p>
          <button type="button" onClick={copy} className="shrink-0 text-blue-300 hover:text-white transition-colors">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
