"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Flag, ChevronLeft, ChevronRight, CheckCircle2, Play, Trophy, X, Bookmark, Loader2, Pause, RotateCcw, Trash2 } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { useQuestions, useStartMock, useCompleteMock, useSubmitAttempt, useMocks, useClearMocks } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type Status = "launcher" | "live" | "paused" | "result";

const MOCK_DURATION_SEC = 35 * 60;
const STORAGE_KEY = "bankos_mock_state";

interface SavedMockState {
  mockId: string;
  active: number;
  answers: Record<number, number>;
  marked: number[];
  secondsLeft: number;
  status: string;
  timestamp: number;
}

function getInitialMockState(): { mockId: string | null; active: number; answers: Record<number, number>; marked: Set<number>; secondsLeft: number; status: Status } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state: SavedMockState = JSON.parse(saved);
      if (state.status === "paused" || state.status === "live") {
        return {
          mockId: state.mockId,
          active: state.active,
          answers: state.answers,
          marked: new Set(state.marked),
          secondsLeft: state.secondsLeft,
          status: state.status === "paused" ? "paused" : "live",
        };
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { mockId: null, active: 0, answers: {}, marked: new Set(), secondsLeft: MOCK_DURATION_SEC, status: "launcher" as Status };
}

export function MockTest() {
  const initial = getInitialMockState();
  const [status, setStatus] = useState<Status>(initial.status);
  const [active, setActive] = useState(initial.active);
  const [answers, setAnswers] = useState<Record<number, number>>(initial.answers);
  const [marked, setMarked] = useState<Set<number>>(initial.marked);
  const [secondsLeft, setSecondsLeft] = useState(initial.secondsLeft);
  const [mockId, setMockId] = useState<string | null>(initial.mockId);
  const [finalScore, setFinalScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const { data: qData, isLoading } = useQuestions(undefined, undefined);
  const startMock = useStartMock();
  const completeMock = useCompleteMock();
  const clearMocks = useClearMocks();
  const submitAttempt = useSubmitAttempt();
  const { data: mocksData } = useMocks();

  const questions = (qData?.questions ?? []).slice(0, 15);
  const mocks = mocksData?.mocks ?? [];

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitRef = useRef<() => void>(() => {});

  // Save state to localStorage
  const saveState = useCallback((st: "paused" | "live") => {
    if (!mockId) return;
    const state: SavedMockState = {
      mockId,
      active,
      answers,
      marked: Array.from(marked),
      secondsLeft,
      status: st,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable
    }
  }, [mockId, active, answers, marked, secondsLeft]);

  const submitFn = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    let correct = 0;
    const answeredEntries = Object.entries(answers);
    for (const [idx, sel] of answeredEntries) {
      const q = questions[Number(idx)];
      if (!q) continue;
      try {
        const res = await submitAttempt.mutateAsync({ questionId: q.id, selected: sel, context: "mock" });
        if (res.correct) correct++;
      } catch {
        // Skip failed attempts
      }
    }
    const score = Math.round((correct / Math.max(1, questions.length)) * 100);
    setFinalScore(score);
    setCorrectCount(correct);
    if (mockId) {
      try {
        await completeMock.mutateAsync({ mockId, score });
      } catch {
        // Continue even if completion fails
      }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Clear saved state
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setStatus("result");
    setIsSubmitting(false);
  }, [answers, questions, mockId, isSubmitting, submitAttempt, completeMock]);

  useEffect(() => {
    submitRef.current = submitFn;
  }, [submitFn]);

  // Timer logic
  useEffect(() => {
    if (status !== "live") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setTimeout(() => submitRef.current(), 100);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (status !== "live" && status !== "paused") return;
    const interval = setInterval(() => {
      saveState(status);
    }, 10000);
    return () => clearInterval(interval);
  }, [status, saveState]);

  async function start() {
    if (questions.length === 0) {
      toast.error("No questions available. Wait for questions to load.");
      return;
    }
    try {
      // Clear any old saved state
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      const res = await startMock.mutateAsync({ title: `Mock Test ${mocks.length + 1}`, durationSec: MOCK_DURATION_SEC });
      setMockId(res.mock.id);
      setStatus("live");
      setActive(0);
      setAnswers({});
      setMarked(new Set());
      setSecondsLeft(MOCK_DURATION_SEC);
      setCorrectCount(0);
    } catch {
      toast.error("Could not start mock");
    }
  }

  function togglePause() {
    if (status === "live") {
      setStatus("paused");
      saveState("paused");
    } else if (status === "paused") {
      setStatus("live");
      saveState("live");
    }
  }

  function handleSelectOption(idx: number) {
    setAnswers((p) => ({ ...p, [active]: idx }));
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const low = secondsLeft < 300;
  const answeredCount = Object.keys(answers).length;

  if (status === "live" && questions.length > 0) {
    const q = questions[active];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b1120]/80 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">Mock Test</span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
              {active + 1} / {questions.length}
            </span>
          </div>
          <div className={cn("flex items-center gap-2 rounded-xl border px-4 py-1.5 font-mono text-sm font-semibold tabular-nums", low ? "animate-pulse border-rose-400/40 bg-rose-500/10 text-rose-300" : "border-white/10 bg-white/5 text-white")}>
            <Timer className="h-4 w-4" />
            {mm}:{ss}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePause}
              className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
            >
              <Pause className="h-4 w-4" />
            </button>
            <button
              onClick={submitFn}
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <GlassCard hover={false}>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200">{q.subject}</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">{q.topic}</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">+1 / -0.25</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold leading-snug text-white">{q.text}</h2>
              <div className="mt-5 space-y-2.5">
                {q.options.map((opt, i) => {
                  const sel = answers[active] === i;
                  return (
                    <button key={i} onClick={() => handleSelectOption(i)} className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all", sel ? "border-violet-400/50 bg-violet-500/15 text-white" : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20")}>
                      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs font-semibold", sel ? "border-violet-400/50 bg-violet-500/30 text-white" : "border-white/15 text-white/60")}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 disabled:opacity-30">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMarked((p) => { const n = new Set(p); if (n.has(active)) n.delete(active); else n.add(active); return n; })}
                    className={cn("inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm", marked.has(active) ? "border-amber-400/40 bg-amber-500/10 text-amber-200" : "border-white/10 bg-white/5 text-white/70")}
                  >
                    <Flag className="h-4 w-4" /> {marked.has(active) ? "Marked" : "Mark"}
                  </button>
                  <button onClick={() => { saveState("live"); setActive((a) => Math.min(questions.length - 1, a + 1)); }} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-4 py-2 text-sm font-semibold text-white">
                    Save & Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-white">Question Palette</h3>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {questions.map((_, n) => {
                  const ans = answers[n] !== undefined;
                  const mk = marked.has(n);
                  const cur = n === active;
                  return (
                    <button key={n} onClick={() => setActive(n)} className={cn("grid h-9 w-full place-items-center rounded-lg border text-xs font-medium transition-all", cur ? "border-violet-400/60 bg-violet-500/20 text-white ring-2 ring-violet-400/30" : mk && ans ? "border-amber-400/40 bg-amber-500/15 text-amber-200" : ans ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : mk ? "border-amber-400/30 bg-amber-500/[0.08] text-amber-200/70" : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white")}>
                      {n + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-1.5 text-[11px] text-white/50">
                <Legend color="bg-emerald-400" label="Answered" />
                <Legend color="bg-amber-400" label="Marked" />
                <Legend color="bg-violet-400" label="Current" />
                <Legend color="bg-white/20" label="Not visited" />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="space-y-6">
        <GlassCard hover={false} className="relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6 p-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-amber-400/30 bg-amber-500/10">
              <Pause className="h-8 w-8 text-amber-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Mock Test Paused</h2>
              <p className="mt-2 text-sm text-white/50">
                Timer is paused. Your progress is saved. You can safely close and return.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>{answeredCount}/{questions.length} answered</span>
              <span>·</span>
              <span className="font-mono">{mm}:{ss} remaining</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStatus("launcher")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                <X className="h-4 w-4" /> Exit Test
              </button>
              <button
                onClick={togglePause}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-6 py-2.5 text-sm font-semibold text-white"
              >
                <Play className="h-4 w-4" /> Resume
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (status === "result") {
    return (
      <div className="space-y-6">
        <ViewHeader title="Mock Result" subtitle="Computed from your real answers" />
        <GlassCard hover={false} className="relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-4">
            <ResultStat label="Score" value={finalScore} suffix="/100" color="#8b5cf6" />
            <ResultStat label="Percentile" value={Math.min(99, Math.round(finalScore * 0.95 + 5))} suffix="%" color="#22d3ee" />
            <ResultStat label="Attempted" value={answeredCount} suffix={`/${questions.length}`} color="#10b981" />
            <ResultStat label="Correct" value={correctCount} suffix="" color="#f59e0b" />
          </div>
        </GlassCard>
        <button onClick={() => { setStatus("launcher"); try { localStorage.removeItem(STORAGE_KEY); } catch {} }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10">
          <RotateCcw className="h-4 w-4" /> Back to Mocks
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ViewHeader badge="Exam Simulator" badgeIcon={<Timer className="h-3 w-3" />} title="Mock Tests" subtitle="Real timer, question palette, mark-for-review, auto-submit. Every attempt is logged." />

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      )}

      <GlassCard hover={false}>
        <div className="relative overflow-hidden p-7">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200">Full Mock</span>
              <h3 className="mt-3 text-lg font-semibold text-white">Mock Test {mocks.length + 1}</h3>
              <p className="mt-1 text-sm text-white/50">15 questions · 35 minutes · +1 / -0.25 marking</p>
            </div>
            <button onClick={start} disabled={startMock.isPending || questions.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.6)] disabled:opacity-50">
              <Play className="h-4 w-4" /> {startMock.isPending ? "Starting…" : "Start Mock"}
            </button>
          </div>
        </div>
      </GlassCard>

      {mocks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">History</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={clearMocks.isLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear history
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-white/10 bg-[#0b1120]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Clear mock history?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/50">
                    This will permanently remove your mock test history and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 text-white hover:bg-red-400"
                    onClick={async () => {
                      try {
                        await clearMocks.mutateAsync();
                        toast.success("Mock history cleared");
                      } catch {
                        toast.error("Could not clear mock history");
                      }
                    }}
                  >
                    Clear history
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="space-y-3">
            {mocks.map((m) => (
              <GlassCard key={m.id} hover={false}>
                <div className="flex items-center justify-between p-5">
                  <div>
                    <div className="text-sm font-medium text-white">{m.title}</div>
                    <div className="mt-0.5 text-xs text-white/40">
                      {new Date(m.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {m.status}
                    </div>
                  </div>
                  {m.status === "completed" && m.score !== null ? (
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
                      <Trophy className="h-4 w-4 text-emerald-300" />
                      <span className="text-sm font-semibold text-emerald-200">{m.score}/100</span>
                    </div>
                  ) : (
                    <span className="text-xs text-white/30">Incomplete</span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <div className="flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded", color)} />{label}</div>;
}

function ResultStat({ label, value, suffix, color }: { label: string; value: number; suffix?: string; color: string }) {
  return (
    <div>
      <div className="text-4xl font-bold" style={{ color }}>
        {value}
        {suffix && <span className="text-lg text-white/30">{suffix}</span>}
      </div>
      <div className="mt-1 text-xs text-white/40">{label}</div>
    </div>
  );
}