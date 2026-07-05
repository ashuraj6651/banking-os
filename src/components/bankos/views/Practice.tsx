"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Bookmark, BookmarkCheck, Filter, Check, ChevronRight, Infinity as Inf, Loader2, RefreshCw } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { useQuestions, useSubmitAttempt } from "@/lib/hooks";
import { useBankOS } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUBJECTS = ["All", "Reasoning", "English", "Quant", "Current Affairs", "Banking"] as const;
const DIFFS = ["All", "Easy", "Medium", "Hard"] as const;

export function Practice() {
  const { startSession } = useBankOS();
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("All");
  const [diff, setDiff] = useState<(typeof DIFFS)[number]>("All");
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    // Restore bookmarks from localStorage
    try {
      const saved = localStorage.getItem("bankos_bookmarks");
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [answered, setAnswered] = useState<Record<string, { sel: number; correct: boolean; explanation: string }>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const submit = useSubmitAttempt();

  // Read filter preference from localStorage (set by CurrentAffairs "Take Quiz")
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bankos_practice_filter");
      if (saved) {
        const filter = JSON.parse(saved) as { subject: string; difficulty: string };
        if (filter.subject && SUBJECTS.includes(filter.subject as typeof SUBJECTS[number])) {
          setSubject(filter.subject as typeof SUBJECTS[number]);
        }
        if (filter.difficulty && DIFFS.includes(filter.difficulty as typeof DIFFS[number])) {
          setDiff(filter.difficulty as typeof DIFFS[number]);
        }
        localStorage.removeItem("bankos_practice_filter");
      }
    } catch {
      // Ignore
    }
  }, []);

  // Persist bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bankos_bookmarks", JSON.stringify([...bookmarks]));
    } catch {
      // Ignore
    }
  }, [bookmarks]);

  const { data, isLoading, isError } = useQuestions(subject, diff, refreshKey);
  const filtered = data?.questions ?? [];

  const answeredCount = Object.keys(answered).length;
  const allAnswered = filtered.length > 0 && answeredCount >= filtered.length;

  useEffect(() => {
    if (isRefreshing && !isLoading) {
      if (isError) {
        toast.error("Could not refresh questions");
      } else {
        toast.success("Fresh questions loaded");
      }
      setIsRefreshing(false);
    }
  }, [isRefreshing, isLoading, isError]);

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function refreshQuestions() {
    setIsRefreshing(true);
    setAnswered({});
    setRefreshKey((k) => k + 1);
  }

  // Auto-refresh when all questions are answered
  const handleAnswer = useCallback(async (qId: string, idx: number) => {
    if (answered[qId]) return;
    try {
      const res = await submit.mutateAsync({
        questionId: qId,
        selected: idx,
        context: "practice",
      });
      setAnswered((p) => ({ ...p, [qId]: { sel: idx, correct: res.correct, explanation: res.explanation } }));
      if (res.correct) toast.success("Correct! +10 XP");
      else toast.error("Not quite — saved to your Error Notebook");
    } catch {
      toast.error("Could not submit answer");
    }
  }, [answered, submit]);

  return (
    <div className="space-y-6">
      <ViewHeader
        badge="Drill"
        badgeIcon={<Layers className="h-3 w-3" />}
        title="Question Practice"
        subtitle="Practice across every section. Every attempt updates your mastery in real time."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={refreshQuestions}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Loading…" : "New Questions"}
            </button>
            <button
              onClick={() => startSession()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.6)]"
            >
              <Inf className="h-4 w-4" /> Focus Mode
            </button>
          </div>
        }
      />

      {/* Filters */}
      <GlassCard hover={false}>
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Filter className="h-4 w-4" /> Filters
            {answeredCount > 0 && (
              <span className="ml-2 text-xs text-violet-300">{answeredCount}/{filtered.length} answered</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => { setSubject(s); setAnswered({}); }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  subject === s
                    ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {DIFFS.map((d) => (
              <button
                key={d}
                onClick={() => { setDiff(d); setAnswered({}); }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  diff === d
                    ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Auto-refresh banner */}
      {allAnswered && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-semibold text-white">All questions completed!</div>
              <div className="text-xs text-white/40">Load a fresh set to keep practicing.</div>
            </div>
            <button
              onClick={refreshQuestions}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Load More
            </button>
          </div>
        </GlassCard>
      )}

      {/* Question list */}
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-shimmer rounded-3xl p-6">
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-lg bg-white/[0.06]" />
                  <div className="h-5 w-12 rounded-lg bg-white/[0.06]" />
                  <div className="h-5 w-10 rounded-lg bg-white/[0.06]" />
                </div>
                <div className="mt-4 h-5 w-3/4 rounded bg-white/[0.06]" />
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="h-12 rounded-xl bg-white/[0.04]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {filtered.map((q, i) => {
            const ans = answered[q.id];
            const revealed = !!ans;
            const bm = bookmarks.has(q.id);
            return (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard hover={false}>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200">
                          {q.subject}
                        </span>
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">
                          {q.topic}
                        </span>
                        <span
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-[11px] font-medium",
                            q.difficulty === "Easy" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
                            q.difficulty === "Medium" && "border-amber-400/30 bg-amber-500/10 text-amber-200",
                            q.difficulty === "Hard" && "border-rose-400/30 bg-rose-500/10 text-rose-200"
                          )}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleBookmark(q.id)}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg border transition-colors",
                          bm
                            ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                            : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70"
                        )}
                      >
                        {bm ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold leading-snug text-white">{q.text}</h3>

                    <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                      {q.options.map((opt, idx) => {
                        const isCorrect = idx === q.answer;
                        const isSelected = ans?.sel === idx;
                        return (
                          <button
                            key={idx}
                            disabled={revealed}
                            onClick={() => handleAnswer(q.id, idx)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                              !revealed && "border-white/10 bg-white/[0.03] hover:border-violet-400/40 hover:bg-violet-500/[0.06]",
                              revealed && isCorrect && "border-emerald-400/40 bg-emerald-500/10 text-white",
                              revealed && isSelected && !isCorrect && "border-rose-400/40 bg-rose-500/10 text-white",
                              revealed && !isCorrect && !isSelected && "border-white/[0.06] bg-white/[0.02] text-white/40"
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs font-semibold",
                                !revealed && "border-white/15 text-white/60",
                                revealed && isCorrect && "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
                                revealed && isSelected && !isCorrect && "border-rose-400/50 bg-rose-500/20 text-rose-200",
                                revealed && !isCorrect && !isSelected && "border-white/10 text-white/30"
                              )}
                            >
                              {revealed && isCorrect ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {revealed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                              Explanation
                            </div>
                            <p className="mt-1.5 text-sm leading-relaxed text-white/70">{ans?.explanation}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="py-16 text-center text-white/40">No questions match these filters.</div>
      )}
    </div>
  );
}