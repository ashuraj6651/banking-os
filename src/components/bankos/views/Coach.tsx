"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, Sunrise, Moon, TrendingUp, Target } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = [
  "Analyse my week and tell me my biggest weakness",
  "Build a 7-day plan to crack DI",
  "Give me 3 RC speed strategies",
  "How do I stop silly mistakes in Quant?",
];

const BRIEFINGS = [
  { icon: Sunrise, title: "Morning Briefing", desc: "Today's priority + motivation", color: "amber" },
  { icon: TrendingUp, title: "Performance Review", desc: "Weekly accuracy & speed", color: "violet" },
  { icon: Moon, title: "Night Review", desc: "Reflect & plan tomorrow", color: "cyan" },
  { icon: Target, title: "Strategy Call", desc: "Personalised exam plan", color: "emerald" },
] as const;

export function Coach() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
} 
  useEffect(() => {
    fetch("/api/coach")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.messages)) setMessages(data.messages);
      })
      .catch(() => {
        setMessages([
          {
            role: "assistant",
            content: `${getGreeting()}, Ashu. I'm your Mentor. I've reviewed your week — Reasoning is trending up (+4%), but Quant accuracy dipped on the last mock. Want me to build a focused 3-day Quant recovery plan?`,},
        ]);
      })
      .finally(() => setHistoryLoaded(true));
  }, []);

  async function clearHistory() {
    setMessages([]);
    try {
      await fetch("/api/coach", { method: "DELETE" });
    } catch {
      // ignore — best effort
    }
    fetch("/api/coach")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.messages)) setMessages(data.messages);
      });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next
            .filter((m) => m.role !== "assistant" || m.content)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const content =
        data?.content ??
        "I'm having trouble connecting right now. Try again in a moment — your prep momentum matters.";
      setMessages((m) => [...m, { role: "assistant", content }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Connection hiccup. Quick tip while I reconnect: review your last 5 Quant mistakes — pattern recognition beats volume.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        badge="AI Mentor"
        badgeIcon={<Sparkles className="h-3 w-3" />}
        title="Your AI Coach"
        subtitle="Briefings, performance analysis, motivation and personalised strategy — updated every day."
        actions={
          <button
            onClick={clearHistory}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
          >
            Clear chat
          </button>
        }
      />

      {/* Briefing cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BRIEFINGS.map((b, i) => {
          const Icon = b.icon;
          const colorMap: Record<string, string> = {
            amber: "from-amber-500/20 to-transparent border-amber-400/20 text-amber-300",
            violet: "from-violet-500/20 to-transparent border-violet-400/20 text-violet-300",
            cyan: "from-cyan-500/20 to-transparent border-cyan-400/20 text-cyan-300",
            emerald: "from-emerald-500/20 to-transparent border-emerald-400/20 text-emerald-300",
          };
          return (
            <GlassCard key={b.title} delay={i * 0.05}>
              <button
                onClick={() => send(`${b.title}: ${b.desc}. Give me a quick personalised briefing.`)}
                className={cn(
                  "flex w-full flex-col items-start gap-3 rounded-3xl bg-gradient-to-b p-5 text-left",
                  colorMap[b.color]
                )}
              >
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl border bg-white/5", colorMap[b.color])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{b.title}</div>
                  <div className="mt-0.5 text-xs text-white/50">{b.desc}</div>
                </div>
              </button>
            </GlassCard>
          );
        })}
      </div>

      {/* Chat */}
      <GlassCard hover={false} className="overflow-hidden">
        <div className="flex h-[560px] flex-col">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6 scrollbar-premium">
            {!historyLoaded && (
              <div className="space-y-3">
                <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-white/[0.04]" />
                <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-white/[0.04]" />
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
                >
                  <div
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold",
                      m.role === "assistant"
                        ? "bg-gradient-to-br from-violet-500 to-electric-500 text-white"
                        : "bg-white/10 text-white/70"
                    )}
                  >
                    {m.role === "assistant" ? <Sparkles className="h-4 w-4" /> : "AS"}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "assistant"
                        ? "rounded-tl-sm border border-white/[0.06] bg-white/[0.03] text-white/85"
                        : "rounded-tr-sm bg-gradient-to-b from-violet-500 to-electric-600 text-white"
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="space-y-2.5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                            strong: ({ children }) => (
                              <strong className="font-semibold text-white">{children}</strong>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc space-y-1 pl-5">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal space-y-1 pl-5">{children}</ol>
                            ),
                            li: ({ children }) => <li className="pl-0.5">{children}</li>,
                            h1: ({ children }) => (
                              <h3 className="text-sm font-bold text-white mt-3">{children}</h3>
                            ),
                            h2: ({ children }) => (
                              <h3 className="text-sm font-bold text-white mt-3">{children}</h3>
                            ),
                            h3: ({ children }) => (
                              <h4 className="text-sm font-semibold text-violet-200 mt-3">{children}</h4>
                            ),
                            code: ({ children }) => (
                              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{children}</code>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-electric-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="space-y-2.5 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] px-4 py-3.5">
                  <div className="h-3 w-52 animate-pulse rounded-full bg-white/[0.07]" />
                  <div className="h-3 w-36 animate-pulse rounded-full bg-white/[0.06]" />
                  <div className="flex items-center gap-1.5 pt-1">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-violet-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, delay: d * 0.15, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 px-6 pb-3">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60 transition-all hover:scale-[1.04] hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200 hover:shadow-[0_0_16px_-2px_rgba(139,92,246,0.2)]"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.06] p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all focus-within:border-violet-400/40 focus-within:shadow-[0_0_24px_-2px_rgba(139,92,246,0.25)]"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your Mentor anything…"
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 text-white transition-shadow hover:shadow-[0_4px_16px_-2px_rgba(139,92,246,0.6)] disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
