"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Lightbulb,
  NotebookPen,
  ChevronRight,
  Flag,
  Check,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useBankOS } from "@/lib/store";
import {
  useQuestions,
  useSubmitAttempt,
  useStartSession,
  useEndSession,
  useToggleMission,
  Mission,
} from "@/lib/hooks";
import { cn } from "@/lib/utils";

// Fisher–Yates shuffle — returns a new shuffled array, doesn't mutate input.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Map mission type → question subject filter
const MISSION_SUBJECT: Record<string, string> = {
  rc: "English",
  puzzle: "Reasoning",
  quant: "Quant",
  current: "Current Affairs",
  mock: "All", // full mock = mixed subjects
};

export function FocusMode() {
  const { endSession, focusMission, focusMode } = useBankOS();
  // Filter questions by the mission's subject (or "All" for mock sessions)
  const subjectFilter = focusMission?.type ? MISSION_SUBJECT[focusMission.type] ?? "All" : "All";
  const { data: qData } = useQuestions(subjectFilter);
  const submitAttempt = useSubmitAttempt();
  const startSession = useStartSession();
  const endSessionMut = useEndSession();
  const toggleMission = useToggleMission();

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [note, setNote] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; answer: number; explanation: string } | null>(null);

  const rawQuestions = qData?.questions ?? [];
  // Shuffle once per fetch so the order isn't always the same DB order.
  // Re-shuffles automatically whenever a fresh question set arrives.
  const questions = useMemo(() => shuffle(rawQuestions), [qData]);
  // When we loop back around (idx wraps past the end), reshuffle again so a
  // repeated pass through a small question bank doesn't feel identical.
  const lap = Math.floor(idx / Math.max(1, questions.length));
  const shuffledForLap = useMemo(() => shuffle(questions), [lap, qData]);
  const q = shuffledForLap[idx % Math.max(1, shuffledForLap.length)];

  // Duration-based countdown (in seconds), derived from the mission's
  // allotted time (falls back to 25 min if not specified).
  const durationSec = (focusMission?.duration ?? 25) * 60;
  const timeLeft = Math.max(0, durationSec - seconds);

  // start a study session on mount
  useEffect(() => {
    if (!focusMode) return;
    startSession.mutate(undefined, {
      onSuccess: (d) => setSessionId(d.session.id),
    });
     
  }, [focusMode]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-finish only when the mission's actual allotted time runs out —
  // not tied to question count anymore.
  useEffect(() => {
    if (seconds >= durationSec) {
      finish();
    }
     
  }, [seconds, durationSec]);

  function finish() {
    if (sessionId) {
      endSessionMut.mutate({
        sessionId,
        questionsAttempted: attempted,
        correctCount: correct,
        durationSec: seconds,
      });
    }
    // Mark the mission as complete on Mission Control so progress/checkbox
    // actually reflects the work done here — this was previously never wired up.
    if (focusMission && !focusMission.done && attempted > 0) {
      toggleMission.mutate(focusMission.id);
    }
    endSession();
  }

  async function answer(i: number) {
    if (revealed || !q) return;
    setSelected(i);
    setRevealed(true);
    setAttempted((a) => a + 1);
    const res = await submitAttempt.mutateAsync({
      questionId: q.id,
      selected: i,
      context: "focus",
      timeTakenSec: seconds,
    });
    setResult(res);
    if (res.correct) setCorrect((c) => c + 1);
  }

  function next() {
    setSelected(null);
    setRevealed(false);
    setResult(null);
    setShowHint(false);
    setIdx((i) => i + 1);
    // NOTE: session no longer auto-finishes just because we've cycled
    // through all available questions once — it keeps looping (idx % length)
    // until the mission's actual time is up. See the time-based useEffect.
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  // Session ends ONLY when the mission's actual time is up, or there were
  // never any questions to begin with. Running out of a small question bank
  // no longer ends the session early — it loops back and keeps going.
  const noQuestionsAtAll = questions.length === 0 && seconds > 5; // give the API a moment to load
  if (seconds >= durationSec || noQuestionsAtAll) {
    return <SessionComplete correct={correct} total={attempted} seconds={seconds} onFinish={finish} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] focus-veil"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora opacity-40" />
      </div>

      <div className="relative flex h-full flex-col">
        {/* ===== Top bar ===== */}
        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={finish}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
            >
              <X className="h-4 w-4" /> Exit
            </button>
            <span className="hidden text-sm text-white/40 sm:inline">
              {focusMission?.title ?? "Focus Session"}
              {subjectFilter !== "All" && (
                <span className="ml-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                  {subjectFilter}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
              <Clock className="h-4 w-4 text-cyan-300" />
              <span className="font-mono text-sm font-semibold text-white tabular-nums">
                {mm}:{ss}
              </span>
            </div>
            <div className="hidden items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 sm:flex">
              <Check className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-semibold text-emerald-200">{correct} correct</span>
            </div>
          </div>
        </header>

        {/* ===== Progress ===== */}
        <div className="px-5 sm:px-8">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Question {attempted + 1}</span>
            <span>{Math.round((seconds / durationSec) * 100)}% of session used</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-electric-500 to-cyan-400"
              animate={{ width: `${Math.min(100, (seconds / durationSec) * 100)}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* ===== Question ===== */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
          {!q ? (
            <div className="flex items-center gap-3 text-white/50">
              <Sparkles className="h-5 w-5 animate-pulse" /> Loading questions…
            </div>
          ) : (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl"
            >
              <div className="mb-5 flex items-center gap-2">
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

              <h2 className="text-balance text-2xl font-semibold leading-snug text-white sm:text-3xl">
                {q.text}
              </h2>

              <div className="mt-7 space-y-3">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.answer;
                  const isSelected = selected === i;
                  const show = revealed;
                  return (
                    <button
                      key={i}
                      disabled={revealed}
                      onClick={() => answer(i)}
                      className={cn(
                        "group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300",
                        !show && "border-white/10 bg-white/[0.03] hover:border-violet-400/40 hover:bg-violet-500/[0.06]",
                        show && isCorrect && "border-emerald-400/40 bg-emerald-500/10",
                        show && isSelected && !isCorrect && "border-rose-400/40 bg-rose-500/10",
                        show && !isCorrect && !isSelected && "border-white/[0.06] bg-white/[0.02] opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-sm font-semibold transition-colors",
                          !show && "border-white/15 text-white/60 group-hover:border-violet-400/40 group-hover:text-violet-300",
                          show && isCorrect && "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
                          show && isSelected && !isCorrect && "border-rose-400/50 bg-rose-500/20 text-rose-200",
                          show && !isCorrect && !isSelected && "border-white/10 text-white/30"
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={cn("flex-1 text-sm sm:text-base", show ? "text-white" : "text-white/80")}>
                        {opt}
                      </span>
                      {show && isCorrect && <Check className="h-5 w-5 text-emerald-300" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {revealed && result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-violet-200">
                      <Sparkles className="h-4 w-4" /> AI Explanation
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{result.explanation}</p>
                  </div>
                </motion.div>
              )}

              {/* Hint */}
              {showHint && !revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                      <Lightbulb className="h-4 w-4" /> Hint
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">
                      Break the problem into smaller steps. Identify the pattern or core concept before computing — don&apos;t rush to the options.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
          </div>
        </div>

        {/* ===== Bottom dock ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHint((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
            >
              <Lightbulb className="h-4 w-4" /> AI Hint
            </button>
            <button
              onClick={() => setShowNote((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
            >
              <NotebookPen className="h-4 w-4" /> Notebook
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10">
              <Flag className="h-4 w-4" /> Flag
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={next}
              disabled={!revealed}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.6)] transition-shadow hover:shadow-[0_10px_30px_-6px_rgba(139,92,246,0.85)] disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={finish}
              disabled={!revealed}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              Finish Session
            </button>
          </div>
        </div>

        {/* ===== Notebook slide-over ===== */}
        <AnimatePresence>
          {showNote && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="absolute bottom-0 right-0 top-0 z-10 w-full max-w-sm border-l border-white/10 bg-[#0b1120]/95 p-6 backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Quick Note</h3>
                <button onClick={() => setShowNote(false)} className="text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Jot down a concept, shortcut or doubt…"
                className="mt-4 h-48 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white placeholder:text-white/30 focus:border-violet-400/40 focus:outline-none"
              />
              <p className="mt-3 text-xs text-white/40">
                Wrong answers are auto-saved to your Error Notebook.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SessionComplete({
  correct,
  total,
  seconds,
  onFinish,
}: {
  correct: number;
  total: number;
  seconds: number;
  onFinish: () => void;
}) {
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] grid place-items-center focus-veil"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora opacity-40" />
      </div>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1120]/90 p-8 text-center backdrop-blur-2xl"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-electric-500">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-white">Session Complete</h2>
        <p className="mt-1 text-sm text-white/50">Well done. Every rep counts.</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-2xl font-bold text-emerald-300">{correct}/{total}</div>
            <div className="text-[11px] text-white/40">Correct</div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-2xl font-bold text-violet-300">{acc}%</div>
            <div className="text-[11px] text-white/40">Accuracy</div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-2xl font-bold text-cyan-300">{mm}:{ss}</div>
            <div className="text-[11px] text-white/40">Time</div>
          </div>
        </div>
        <button
          onClick={onFinish}
          className="mt-6 w-full rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 py-3 text-sm font-semibold text-white"
        >
          Back to Mission Control
        </button>
      </motion.div>
    </motion.div>
  );
}