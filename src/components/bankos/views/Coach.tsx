"use client";

import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Moon,
  Send,
  Sparkles,
  Sunrise,
  Target,
  TrendingUp,
} from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { cn } from "@/lib/utils";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

type Usage = {
  weeklyLimit: number;
  usedThisWeek: number;
  remainingThisWeek: number;
};

const DEFAULT_USAGE: Usage = {
  weeklyLimit: 20,
  usedThisWeek: 0,
  remainingThisWeek: 20,
};

const QUICK = [
  "Make me a 7-day study plan",
  "How can I improve my Quant score?",
  "Give me an English practice strategy",
  "How should I analyse my mock test?",
];

const BRIEFINGS = [
  {
    icon: Sunrise,
    title: "Morning briefing",
    prompt: "Give me a short, practical study plan for today.",
  },
  {
    icon: TrendingUp,
    title: "Performance review",
    prompt: "How should I review my recent practice and improve?",
  },
  {
    icon: Moon,
    title: "Evening reflection",
    prompt: "Help me reflect on today's preparation and plan tomorrow.",
  },
  {
    icon: Target,
    title: "Exam strategy",
    prompt: "Give me a practical strategy for my next banking exam mock.",
  },
];

function readUsage(data: unknown, fallback: Usage = DEFAULT_USAGE): Usage {
  if (!data || typeof data !== "object") return fallback;

  const value = data as Record<string, unknown>;
  const limit =
    typeof value.weeklyLimit === "number"
      ? value.weeklyLimit
      : fallback.weeklyLimit;
  const used =
    typeof value.usedThisWeek === "number"
      ? value.usedThisWeek
      : fallback.usedThisWeek;
  const remaining =
    typeof value.remainingThisWeek === "number"
      ? value.remainingThisWeek
      : Math.max(0, limit - used);

  return {
    weeklyLimit: limit,
    usedThisWeek: used,
    remainingThisWeek: remaining,
  };
}

function cleanAssistantMarkdown(content: string) {
  return content.replace(/<br\s*\/?>/gi, " · ");
}

export function Coach() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<Usage>(DEFAULT_USAGE);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quotaReached = usage.remainingThisWeek <= 0;

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await fetch("/api/coach");
        if (!response.ok) throw new Error("Could not load your coach chat.");

        const data = await response.json();
        if (cancelled) return;

        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }

        setUsage(readUsage(data));
      } catch {
        if (!cancelled) {
          setMessages([
            {
              role: "assistant",
              content:
                "Hi! I'm your AI Mentor. I can help with Quant, Reasoning, English, General Awareness, mock analysis, and study planning. What would you like to work on?",
            },
          ]);
        }
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = scrollRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  async function clearHistory() {
    try {
      const response = await fetch("/api/coach", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not clear chat.");

      const historyResponse = await fetch("/api/coach");
      if (!historyResponse.ok) throw new Error("Could not reload chat.");

      const data = await historyResponse.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setUsage(readUsage(data));
    } catch {
      // Keep the current chat visible if clearing or reloading fails.
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();

    if (
      !trimmed ||
      loading ||
      !historyLoaded ||
      usage.remainingThisWeek <= 0
    ) {
      return;
    }

    const nextMessages: Msg[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setUsage((previous) => readUsage(data, previous));
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              data.error ||
              "You've used all your AI Coach chats for this week. Your limit resets Monday at midnight IST.",
          },
        ]);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "The AI Coach couldn't reply.");
      }

      setUsage((previous) => readUsage(data, previous));
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data.content || "I couldn't create a reply. Please try again.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Couldn't connect to the AI Coach. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0 lg:gap-3 lg:overflow-hidden">
      <ViewHeader
        title="AI Coach"
        subtitle="Your personal guide for banking exam preparation"
        icon={Sparkles}
        actions={
          <div className="flex items-center gap-2">
            <div
              title="Weekly limit resets Monday at midnight IST"
              className="flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/[0.08] px-3 py-2"
            >
              <span className="hidden text-xs text-white/55 sm:inline">
                Chats left this week
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  quotaReached ? "text-amber-300" : "text-violet-200",
                )}
              >
                {historyLoaded
                  ? `${usage.remainingThisWeek}/${usage.weeklyLimit}`
                  : "…"}
              </span>
            </div>

            <button
              type="button"
              onClick={clearHistory}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
            >
              Clear chat
            </button>
          </div>
        }
      />

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {BRIEFINGS.map((briefing) => {
          const Icon = briefing.icon;

          return (
            <button
              key={briefing.title}
              type="button"
              disabled={!historyLoaded || loading || quotaReached}
              onClick={() => send(briefing.prompt)}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-left transition hover:border-violet-400/30 hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon className="mb-2 h-5 w-5 text-violet-300" />
              <span className="text-sm font-medium text-white">
                {briefing.title}
              </span>
            </button>
          );
        })}
      </div>

      <GlassCard hover={false} className="flex min-h-[480px] flex-col overflow-hidden p-0 lg:min-h-0 lg:flex-1">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7"
        >
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={`${index}-${message.role}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[78%]",
                    message.role === "user"
                      ? "rounded-br-md bg-violet-500/15 text-white"
                      : "rounded-bl-md border border-white/10 bg-white/[0.035] text-white/80",
                  )}
                >
                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="mb-3 last:mb-0">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                            {children}
                          </ol>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-white">
                            {children}
                          </strong>
                        ),
                        h1: ({ children }) => (
                          <h1 className="mb-2 text-base font-semibold text-white">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="mb-2 text-base font-semibold text-white">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="mb-2 font-semibold text-white">
                            {children}
                          </h3>
                        ),
                        table: ({ children }) => (
                          <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-white/10">
                            <table className="w-full min-w-[480px] border-collapse text-left text-xs">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border-b border-white/10 bg-white/[0.04] px-3 py-2 font-semibold text-white">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border-b border-white/[0.06] px-3 py-2 align-top text-white/75">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {cleanAssistantMarkdown(message.content)}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/50">
                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                Thinking…
              </div>
            </div>
          )}

          {historyLoaded && messages.length === 0 && !loading && (
            <p className="py-8 text-center text-sm text-white/45">
              Ask your AI Coach a question to get started.
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-white/[0.08] px-5 py-4 sm:px-7">
          <div className="mb-4 flex flex-wrap gap-2">
            {QUICK.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={!historyLoaded || loading || quotaReached}
                onClick={() => send(prompt)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:border-violet-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          {quotaReached && historyLoaded && (
            <p className="mb-3 text-sm text-amber-200/80">
              You’ve used this week’s AI Coach chats. Your limit resets Monday
              at midnight IST.
            </p>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={!historyLoaded || loading || quotaReached}
              placeholder={
                quotaReached
                  ? "Weekly chat limit reached"
                  : "Ask your AI Coach…"
              }
              className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-400/40 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={
                !historyLoaded ||
                loading ||
                quotaReached ||
                !input.trim()
              }
              aria-label="Send message"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200 transition hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}