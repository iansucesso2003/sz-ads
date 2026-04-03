"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Crown, Shield, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Member {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; createdAt: string };
}

interface MembersTableProps {
  orgId: string;
  currentUserId: string;
  refreshKey?: number;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3.5 w-3.5 text-amber-400" />,
  admin: <Shield className="h-3.5 w-3.5 text-blue-400" />,
  member: <User className="h-3.5 w-3.5 text-white/40" />,
};

const ROLE_LABEL: Record<string, string> = { owner: "Dono", admin: "Admin", member: "Membro" };

export function MembersTable({ orgId, currentUserId, refreshKey }: MembersTableProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/organizations/${orgId}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(Array.isArray(d) ? d : []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const remove = async (userId: string) => {
    setRemoving(userId);
    await fetch(`/api/organizations/${orgId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setRemoving(null);
    load();
  };

  const currentMember = members.find((m) => m.user.id === currentUserId);
  const canManage = currentMember && ["owner", "admin"].includes(currentMember.role);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="divide-y divide-white/5">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
              {(m.user.name ?? m.user.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{m.user.name ?? "—"}</p>
              <p className="text-xs text-white/40 truncate">{m.user.email}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60">
              {ROLE_ICON[m.role]}
              {ROLE_LABEL[m.role] ?? m.role}
            </div>
            {canManage && m.user.id !== currentUserId && m.role !== "owner" && (
              <button
                type="button"
                onClick={() => remove(m.user.id)}
                disabled={removing === m.user.id}
                className="shrink-0 rounded p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
