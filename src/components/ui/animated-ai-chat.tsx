"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  MonitorIcon,
  Paperclip,
  SendIcon,
  XIcon,
  LoaderIcon,
  Sparkles,
  Command,
  BarChart3,
  MessageSquarePlus,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY_PREFIX = "chat-history";
const MAX_CONVERSATIONS = 50;

function getStorageKey(projectId?: string) {
  return projectId ? `${STORAGE_KEY_PREFIX}-${projectId}` : `${STORAGE_KEY_PREFIX}-default`;
}

function loadConversations(projectId?: string): ChatConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: ChatConversation[], projectId?: string) {
  if (typeof window === "undefined") return;
  try {
    const toSave = conversations.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().slice(0, 50);
  return trimmed || "Nova conversa";
}

/** Objetivos de campanha com conjuntos de métricas associados */
const OBJECTIVE_OPTIONS = [
  { value: "geral", label: "Geral", metrics: "todas as métricas relevantes" },
  { value: "vendas", label: "Vendas", metrics: "ROAS, conversões de compra, receita, CPA" },
  { value: "leads", label: "Leads", metrics: "conversões de lead, CPA de lead, taxa de conversão" },
  { value: "trafego", label: "Tráfego", metrics: "CTR, CPC, cliques, bounce rate" },
  { value: "engajamento", label: "Engajamento", metrics: "likes, comentários, shares, saves, CTR" },
  { value: "alcance", label: "Alcance", metrics: "impressões, alcance, frequência, CPM" },
] as const;

type AnalysisObjective = (typeof OBJECTIVE_OPTIONS)[number]["value"];

interface AnimatedAIChatProps {
  projectId?: string;
  datePreset?: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing
              ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {showRing && isFocused && (
          <motion.span
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{ animation: "none" }}
            id="textarea-ripple"
          />
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export function AnimatedAIChat({ projectId, datePreset = "last_7d" }: AnimatedAIChatProps) {
  const [value, setValue] = useState("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("chat-sidebar-open");
    if (stored === "0") setSidebarOpen(false);
  }, []);
  const [attachments, setAttachments] = useState<string[]>([]);

  const activeConvIdRef = useRef<string | null>(null);
  activeConvIdRef.current = activeConversationId;

  const messages = (() => {
    const id = activeConversationId ?? activeConvIdRef.current;
    if (!id) return [];
    const conv = conversations.find((c) => c.id === id);
    return conv?.messages ?? [];
  })();

  const setMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setConversations((prevConvs) => {
        const targetId = activeConversationId ?? activeConvIdRef.current;
        const next = [...prevConvs];
        const idx = targetId ? next.findIndex((c) => c.id === targetId) : -1;
        const currentMessages = idx >= 0 ? next[idx].messages : [];
        const newMessages = updater(currentMessages);

        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            messages: newMessages,
            updatedAt: Date.now(),
            title: newMessages[0]?.role === "user"
              ? generateTitle(newMessages[0].content)
              : next[idx].title,
          };
        } else {
          const newConv: ChatConversation = {
            id: `conv-${Date.now()}`,
            title: newMessages[0]?.role === "user"
              ? generateTitle(newMessages[0].content)
              : "Nova conversa",
            messages: newMessages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          next.unshift(newConv);
          activeConvIdRef.current = newConv.id;
          setActiveConversationId(newConv.id);
        }
        return next;
      });
    },
    [activeConversationId]
  );
  const [isTyping, setIsTyping] = useState(false);
  const [, startTransition] = useTransition();
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 44,
    maxHeight: 120,
  });
  const [inputFocused, setInputFocused] = useState(false);
  const [analysisObjective, setAnalysisObjective] = useState<AnalysisObjective>("geral");
  const commandPaletteRef = useRef<HTMLDivElement>(null);

  const commandSuggestions: CommandSuggestion[] = [
    {
      icon: <BarChart3 className="w-4 h-4" />,
      label: "Analisar campanhas",
      description: "Análise geral das campanhas",
      prefix: "/analisar",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Sugerir otimizações",
      description: "Recomendações de melhoria",
      prefix: "/otimizar",
    },
    {
      icon: <ImageIcon className="w-4 h-4" />,
      label: "Comparar performance",
      description: "Comparar métricas",
      prefix: "/comparar",
    },
    {
      icon: <MonitorIcon className="w-4 h-4" />,
      label: "Identificar problemas",
      description: "Detectar gargalos",
      prefix: "/problemas",
    },
  ];

  useEffect(() => {
    setConversations(loadConversations(projectId));
  }, [projectId]);

  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations, projectId);
    }
  }, [conversations, projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true);

      const matchingSuggestionIndex = commandSuggestions.findIndex((cmd) =>
        cmd.prefix.startsWith(value)
      );

      if (matchingSuggestionIndex >= 0) {
        setActiveSuggestion(matchingSuggestionIndex);
      } else {
        setActiveSuggestion(-1);
      }
    } else {
      setShowCommandPalette(false);
    }
  }, [value]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector("[data-command-button]");

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < commandSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : commandSuggestions.length - 1
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const selectedCommand = commandSuggestions[activeSuggestion];
          setValue(selectedCommand.prefix + " ");
          setShowCommandPalette(false);

          setRecentCommand(selectedCommand.label);
          setTimeout(() => setRecentCommand(null), 3500);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = async (overrideContent?: string) => {
    const content = (overrideContent ?? value).trim();
    if (!content) return;

    const userMessage = { role: "user" as const, content };
    setMessages((prev) => [...prev, userMessage]);
    if (!overrideContent) {
      setValue("");
      adjustHeight(true);
    }
    setIsTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          projectId,
          datePreset,
          analysisObjective,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar");
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Erro: ${(err as Error).message}` },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    const sessionKey = `auto-report-${projectId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const storedConvs = loadConversations(projectId);
    const hasMessages = storedConvs.some((c) => c.messages.length > 0);
    if (hasMessages) return;

    sessionStorage.setItem(sessionKey, "1");
    const timer = setTimeout(() => {
      handleSendMessage("/analisar Faça um relatório completo das campanhas ativas, destacando os principais números, o que está performando bem e sugestões de melhoria.");
    }, 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleAttachFile = () => {
    const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
    setAttachments((prev) => [...prev, mockFileName]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index];
    setValue(selectedCommand.prefix + " ");
    setShowCommandPalette(false);

    setRecentCommand(selectedCommand.label);
    setTimeout(() => setRecentCommand(null), 2000);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    activeConvIdRef.current = null;
    setValue("");
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    activeConvIdRef.current = id;
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(next[0]?.id ?? null);
        activeConvIdRef.current = next[0]?.id ?? null;
      }
      return next;
    });
  };

  const formatConversationDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString("pt-BR", { weekday: "short" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="h-full flex-1 flex w-full overflow-hidden lab-bg">
      {/* Sidebar - Histórico de conversas */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 flex flex-col border-r border-white/[0.06] bg-black/20 backdrop-blur-sm"
          >
            <div className="p-2 border-b border-white/[0.06]">
              <button
                type="button"
                onClick={handleNewConversation}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <MessageSquarePlus className="w-4 h-4 shrink-0" />
                Nova conversa
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-2 mb-1 flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wider">
                <History className="w-3 h-3" />
                Histórico
              </div>
              {conversations.length === 0 ? (
                <p className="px-3 py-2 text-xs text-white/40">Nenhuma conversa ainda</p>
              ) : (
                <div className="space-y-0.5 px-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectConversation(conv.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleSelectConversation(conv.id)}
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-left",
                        activeConversationId === conv.id
                          ? "bg-violet-500/20 text-white border border-violet-500/30"
                          : "text-white/70 hover:bg-white/5 hover:text-white/90"
                      )}
                    >
                      <span className="flex-1 min-w-0 truncate text-xs" title={conv.title}>
                        {conv.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-white/40">
                        {formatConversationDate(conv.updatedAt)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white/50 transition-all"
                        aria-label="Excluir conversa"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Área principal do chat */}
      <div className="min-h-0 flex-1 flex flex-col relative">
<button
        type="button"
        onClick={() => {
          setSidebarOpen((o) => {
            const next = !o;
            localStorage.setItem("chat-sidebar-open", next ? "1" : "0");
            return next;
          });
        }}
        className={cn(
          "absolute z-20 flex items-center justify-center rounded-r-lg border border-l-0 border-white/10 transition-all",
          "bg-black/60 hover:bg-black/80 text-white/70 hover:text-white",
          "left-0 top-1/2 -translate-y-1/2 w-8 h-12"
        )}
        aria-label={sidebarOpen ? "Ocultar histórico" : "Mostrar histórico"}
        title={sidebarOpen ? "Ocultar histórico" : "Mostrar histórico"}
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-5 h-5" />}
      </button>
        <div className={cn(
          "min-h-0 flex-1 flex flex-col w-full items-center p-6 relative overflow-y-auto",
          messages.length ? "justify-start" : "justify-end pb-12"
        )}>
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
        </div>
        <div className="w-full max-w-xl mx-auto relative">
        <motion.div
          className="relative z-10 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {!messages.length && (
            <div className="text-center space-y-2 mb-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-block"
              >
                <h1 className="text-lg font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                  {isTyping ? "Gerando relatório..." : "Como posso ajudar hoje?"}
                </h1>
                <motion.div
                  className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "100%", opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </motion.div>
              <motion.p
                className="text-xs text-white/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isTyping
                  ? "Analisando suas campanhas e preparando sugestões..."
                  : "Digite um comando ou faça uma pergunta"}
              </motion.p>
              {isTyping && (
                <motion.div
                  className="flex justify-center gap-1 pt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-violet-400"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {messages.length > 0 && (
            <motion.div
              className="max-h-[60vh] min-h-[200px] overflow-y-auto space-y-3 px-2 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "text-white/95"
                        : "text-white/90 border-l-2 border-violet-500/40 pl-4"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </motion.div>
          )}

          <motion.div
            className="relative rounded-2xl border border-white/[0.06]"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="py-1 bg-black/95">
                    {commandSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.prefix}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                          activeSuggestion === index
                            ? "bg-white/10 text-white"
                            : "text-white/70 hover:bg-white/5"
                        )}
                        onClick={() => selectCommandSuggestion(index)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-white/60">
                          {suggestion.icon}
                        </div>
                        <div className="font-medium">{suggestion.label}</div>
                        <div className="text-white/40 text-xs ml-1">
                          {suggestion.prefix}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Pergunte sobre suas campanhas..."
                containerClassName="w-full"
                className={cn(
                  "w-full px-3 py-2",
                  "resize-none",
                  "bg-transparent",
                  "border-none",
                  "text-white/90 text-sm",
                  "focus:outline-none",
                  "placeholder:text-white/20",
                  "min-h-[44px]"
                )}
                style={{ overflow: "hidden" }}
                showRing={false}
              />
            </div>

            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  className="px-4 pb-3 flex gap-2 flex-wrap"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {attachments.map((file, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <span>{file}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3 border-t border-white/[0.05] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  onClick={handleAttachFile}
                  whileTap={{ scale: 0.94 }}
                  className="p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group"
                >
                  <Paperclip className="w-4 h-4" />
                  <motion.span
                    className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    layoutId="button-highlight"
                  />
                </motion.button>
                <motion.button
                  type="button"
                  data-command-button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCommandPalette((prev) => !prev);
                  }}
                  whileTap={{ scale: 0.94 }}
                  className={cn(
                    "p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group",
                    showCommandPalette && "bg-white/10 text-white/90"
                  )}
                >
                  <Command className="w-4 h-4" />
                  <motion.span
                    className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    layoutId="button-highlight"
                  />
                </motion.button>
              </div>

              <motion.button
                type="button"
                onClick={handleSendMessage}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isTyping || !value.trim()}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  "flex items-center gap-2",
                  value.trim()
                    ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10"
                    : "bg-white/[0.05] text-white/40"
                )}
              >
                {isTyping ? (
                  <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                <span>Enviar</span>
              </motion.button>
            </div>
          </motion.div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[10px] text-white/40 uppercase tracking-wider mr-1">Objetivo:</span>
              {OBJECTIVE_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnalysisObjective(opt.value)}
                  title={opt.metrics}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] transition-all",
                    analysisObjective === opt.value
                      ? "bg-violet-500/30 text-white border border-violet-500/50"
                      : "bg-white/[0.02] text-white/50 hover:text-white/80 hover:bg-white/[0.05] border border-transparent"
                  )}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
            {commandSuggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.prefix}
                onClick={() => selectCommandSuggestion(index)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-xs text-white/60 hover:text-white/90 transition-all relative group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {suggestion.icon}
                <span>{suggestion.label}</span>
                <motion.div
                  className="absolute inset-0 border border-white/[0.05] rounded-lg"
                  initial={false}
                  animate={{
                    opacity: [0, 1],
                    scale: [0.98, 1],
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                />
              </motion.button>
            ))}
            </div>
          </div>
        </motion.div>
        </div>
        </div>
      </div>

      <AnimatePresence>
        {isTyping && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-2xl bg-white/[0.02] rounded-full px-4 py-2 shadow-lg border border-white/[0.05]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-7 rounded-full bg-white/[0.05] flex items-center justify-center text-center">
                <span className="text-xs font-medium text-white/90 mb-0.5">
                  IA
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>Analisando...</span>
                <TypingDots />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {inputFocused && (
        <motion.div
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
          animate={{
            x: mousePosition.x - 400,
            y: mousePosition.y - 400,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)",
          }}
        />
      ))}
    </div>
  );
}
