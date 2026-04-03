"use client";

import { useState } from "react";
import { SendIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_CHAT_RESPONSES } from "@/lib/demo-data";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { label: "Analisar campanhas", prefix: "/analisar" },
  { label: "Sugerir otimizações", prefix: "/otimizar" },
];

function getResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("otimiz") || lower.includes("/otimizar")) return DEMO_CHAT_RESPONSES.otimizar;
  if (lower.includes("analis") || lower.includes("/analisar") || lower.includes("relat")) return DEMO_CHAT_RESPONSES.analisar;
  return DEMO_CHAT_RESPONSES.default;
}

export function DemoAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const send = async (text?: string) => {
    const content = (text ?? value).trim();
    if (!content || isTyping) return;
    setValue("");
    setMessages((m) => [...m, { role: "user", content }]);
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    setMessages((m) => [...m, { role: "assistant", content: getResponse(content) }]);
    setIsTyping(false);
  };

  return (
    <div className="flex h-full flex-col relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[128px] animate-pulse delay-700" />
      </div>

      <div className={`flex-1 flex flex-col items-center p-6 overflow-y-auto relative ${messages.length ? "justify-start" : "justify-end pb-8"}`}>
        <div className="w-full max-w-xl mx-auto space-y-4">
          {!messages.length && (
            <div className="text-center space-y-1 mb-4">
              <h1 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40">
                Como posso ajudar hoje?
              </h1>
              <p className="text-xs text-white/40">Digite um comando ou faça uma pergunta</p>
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <motion.div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user" ? "text-white/95" : "text-white/90 border-l-2 border-violet-500/40 pl-4"
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex gap-1 px-4 py-3 border-l-2 border-violet-500/40">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-violet-400"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Pergunte sobre suas campanhas..."
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s.prefix} type="button" onClick={() => send(s.prefix)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                    <Sparkles className="h-3 w-3" />
                    {s.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => send()} disabled={!value.trim() || isTyping}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-600 disabled:opacity-40 transition-colors">
                <SendIcon className="h-3 w-3" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
