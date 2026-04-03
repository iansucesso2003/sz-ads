"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  User,
  Plus,
  FolderKanban,
  LogOut,
  Settings2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "app-sidebar-collapsed";

interface AdAccount {
  id: string;
  adAccountId: string;
  accountName: string | null;
}

interface AppSidebarProps {
  projects: AdAccount[];
}

export function AppSidebar({ projects }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) setCollapsed(stored === "1");
  }, []);

  const toggleSidebar = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  const navItem = (
    href: string,
    label: string,
    icon: React.ReactNode,
    exact?: boolean
  ) => {
    const isActive = exact
      ? pathname === href
      : pathname.startsWith(href);
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center rounded-lg py-2 text-sm transition-colors",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
          isActive
            ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20"
            : "text-white/60 hover:bg-white/5 hover:text-white"
        )}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-white/10 bg-[#0A0A0B] transition-[width] duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className={cn(
          "flex h-14 items-center border-b border-white/10",
          collapsed ? "justify-center px-2" : "justify-between px-3"
        )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-500/40">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 10L5.5 5.5L8 8L10.5 4.5L12 6.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="3.5" r="1.5" fill="#60a5fa"/>
              </svg>
            </div>
            <span className="font-semibold text-white">Sz Ads</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" title="Sz Ads">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-500/40">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 10L5.5 5.5L8 8L10.5 4.5L12 6.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="3.5" r="1.5" fill="#60a5fa"/>
              </svg>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="rounded p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-hidden p-3">
        <div className={cn("mb-4", collapsed && "mb-2")}>
          {!collapsed && (
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-white/40">
              Menu
            </p>
          )}
          {navItem("/dashboard/perfil", "Perfil", <User className="h-4 w-4 shrink-0" />)}
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-white/40">
              Projetos
            </p>
          )}
          {projects.length === 0 ? (
            <Link
              href="/dashboard/projeto/novo"
              title={collapsed ? "Adicionar projeto" : undefined}
              className={cn(
                "flex rounded-lg py-2 text-sm text-white/40 hover:bg-white/5 hover:text-white/60",
                collapsed ? "justify-center px-2" : "items-center gap-3 px-3"
              )}
            >
              <FolderKanban className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Nenhum projeto</span>}
            </Link>
          ) : (
            <div className="space-y-0.5">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "group flex items-center rounded-lg py-2 text-sm transition-colors",
                    collapsed ? "justify-center px-2" : "gap-1 px-3",
                    pathname.startsWith(`/dashboard/projeto/${p.id}`)
                      ? "bg-blue-500/15 ring-1 ring-blue-500/20"
                      : "hover:bg-white/5"
                  )}
                >
                  <Link
                    href={`/dashboard/projeto/${p.id}`}
                    title={collapsed ? (p.accountName || p.adAccountId) : undefined}
                    className={cn(
                      "flex min-w-0 items-center gap-3",
                      collapsed ? "justify-center" : "flex-1",
                      pathname.startsWith(`/dashboard/projeto/${p.id}`)
                        ? "text-blue-400"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    <FolderKanban className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{p.accountName || p.adAccountId}</span>
                    )}
                  </Link>
                  {!collapsed && (
                    <Link
                      href={`/dashboard/projeto/${p.id}/editar`}
                      onClick={(e) => e.stopPropagation()}
                      title="Editar integração"
                      className={cn(
                        "shrink-0 rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10",
                        pathname.startsWith(`/dashboard/projeto/${p.id}/editar`)
                          ? "bg-white/10 text-white opacity-100"
                          : "text-white/50 hover:text-white"
                      )}
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link
            href="/dashboard/projeto/novo"
            title={collapsed ? "Adicionar projeto" : undefined}
            className={cn(
              "mt-2 flex rounded-lg py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white/70",
              collapsed ? "justify-center px-2" : "items-center gap-3 px-3"
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Adicionar projeto</span>}
          </Link>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "flex w-full rounded-lg py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors",
            collapsed ? "justify-center px-2" : "items-center gap-3 px-3"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
