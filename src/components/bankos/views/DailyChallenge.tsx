"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Clock,
  Zap,
  Flame,
  Trophy,
  Share2,
  RotateCcw,
  ChevronRight,
  Check,
  X,
  Loader2,
  ArrowRight,
  Sparkles,
  Copy,
  History,
} from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard, GlassPanel } from "../GlassCard";
import { Counter } from "../Counter";
import { Ring } from "../Ring";
import { useDailyChallengeSet, useSubmitAttempt, type Question } from "@/lib/hooks";
import { QuestionBankPanel } from "../QuestionBankPanel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ================================================================
   localStorage helpers for daily challenge history
   ================================================================ */

type DailyRecord = {
  date: string; // YYYY-MM-DD
  score: number;
  correct: number;
  total: number;
  timeSec: number;
};

// Local calendar date (YYYY-MM-DD) — not UTC, so "today" flips at the user's midnight.
function localDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function getToday(): string {
  return localDate(new Date());
}

/* Questions already served to this browser, sent to the server so a refresh
   never brings the same questions back (the server also skips everything attempted). */
const SEEN_KEY = "dailyChallengeSeenIds";
const SEEN_LIMIT = 600;

function getSeenIds(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function rememberSeenIds(ids: string[], reset: boolean) {
  try {
    const base = reset ? [] : getSeenIds().filter((id) => !ids.includes(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...base, ...ids].slice(-SEEN_LIMIT)));
  } catch {
    // storage unavailable — the server-side attempt history still prevents most repeats
  }
}

function getHistory(): DailyRecord[] {
  try {
    return JSON.parse(localStorage.getItem("dailyChallengeHistory") || "[]");
  } catch {
    return [];
  }
}

function saveRecord(record: DailyRecord) {
  const history = getHistory();
  const idx = history.findIndex((r) => r.date === record.date);
  if (idx >= 0) history[idx] = record;
  else history.push(record);
  localStorage.setItem("dailyChallengeHistory", JSON.stringify(history));
}

function getTodayRecord(): DailyRecord | null {
  const today = getToday();
  return getHistory().find((r) => r.date === today) ?? null;
}

function computeStreak(): number {
  const history = getHistory();
  if (history.length === 0) return 0;
  const dates = history.map((r) => r.date).sort().reverse();
  const today = getToday();
  const yesterday = localDate(new Date(Date.now() - 86400000));
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

function getBestScore(): number {
  const history = getHistory();
  if (history.length === 0) return 0;
  return Math.max(...history.map((r) => r.score));
}

function getAverageScore(): number {
  const history = getHistory();
  if (history.length === 0) return 0;
  return Math.round(history.reduce((s, r) => s + r.score, 0) / history.length);
}

/* ================================================================
   Confetti CSS-only effect
   ================================================================ */

const CONFETTI_COLORS = [
  "#8b5cf6", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e",
  "#a78bfa", "#67e8f9", "#fbbf24", "#34d399", "#fb7185",
];

function ConfettiEffect() {
  const pieces = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }))
  ).current;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall rounded-sm"
          style={{
            backgroundColor: p.color,
            left: `${p.left}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

/* ================================================================
   Main DailyChallenge Component
   ================================================================ */

type Phase = "intro" | "live" | "result";

const TIMER_SECONDS = 30;
const SPEED_BONUS_THRESHOLD = 10;
const POINTS_CORRECT = 20;
const POINTS_WRONG = -5;
const SPEED_BONUS = 10;
const QUESTION_COUNT = 25;

const OPTION_LABELS = ["A", "B", "C", "D"];

export function DailyChallenge() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<
    { sel: number; correct: boolean; explanation: string; timeSec: number; bonus: boolean }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalTimeSec, setTotalTimeSec] = useState(0);
  const [copied, setCopied] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionSec, setSessionSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const lockRef = useRef(false); // one submission per question (timeout + click can race)

  const challengeSet = useDailyChallengeSet();
  const isLoading = challengeSet.isPending;
  const submit = useSubmitAttempt();

  const todayRecord = getTodayRecord();
  const streak = computeStreak();
  const bestScore = getBestScore();
  const avgScore = getAverageScore();

  useEffect(() => {
    if (phase !== "live" || selected !== null) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    questionStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, questionIdx, selected]);

  // Overall clock for the whole 25-question run
  useEffect(() => {
    if (phase !== "live") return;
    const started = Date.now();
    const id = setInterval(() => setSessionSec(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const handleSelect = useCallback(
    async (idx: number | null) => {
      if (phase !== "live" || lockRef.current) return;
      const q = questions[questionIdx];
      if (!q) return;
      lockRef.current = true;
      setIsSubmitting(true);

      const elapsedSec = (Date.now() - questionStartRef.current) / 1000;
      const bonus = elapsedSec < SPEED_BONUS_THRESHOLD;

      setSelected(idx ?? -1); // -1 = timed out
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      try {
        const res = await submit.mutateAsync({
          questionId: q.id,
          selected: idx,
          context: "daily-challenge",
          timeTakenSec: Math.round(elapsedSec),
        });
        setAnswered((prev) => [
          ...prev,
          {
            sel: idx ?? -1,
            correct: res.correct,
            explanation: res.explanation,
            timeSec: Math.round(elapsedSec),
            bonus: res.correct && bonus,
          },
        ]);
        setTotalTimeSec((t) => t + Math.round(elapsedSec));
      } catch {
        // Network/server problem: grade locally so the run can continue.
        const correct = idx !== null && idx === q.answer;
        setAnswered((prev) => [
          ...prev,
          {
            sel: idx ?? -1,
            correct,
            explanation: q.explanation || "Could not save this attempt, but your answer was checked.",
            timeSec: Math.round(elapsedSec),
            bonus: correct && bonus,
          },
        ]);
        setTotalTimeSec((t) => t + Math.round(elapsedSec));
      } finally {
        setIsSubmitting(false);
      }
    },
    [phase, questions, questionIdx, submit]
  );

  useEffect(() => {
    if (phase === "live" && timeLeft === 0 && selected === null) {
      handleSelect(null);
    }
  }, [timeLeft, phase, selected, handleSelect]);

  function nextQuestion() {
    if (questionIdx + 1 >= questions.length) {
      const record: DailyRecord = {
        date: getToday(),
        score: computeScore(),
        correct: answered.filter((a) => a.correct).length,
        total: questions.length,
        timeSec: totalTimeSec,
      };
      saveRecord(record);
      if (answered.every((a) => a.correct)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      setPhase("result");
    } else {
      lockRef.current = false;
      setQuestionIdx((i) => i + 1);
      setSelected(null);
      setTimeLeft(TIMER_SECONDS);
    }
  }

  function computeScore(): number {
    return answered.reduce((s, a) => {
      let pts = a.correct ? POINTS_CORRECT : POINTS_WRONG;
      if (a.correct && a.bonus) pts += SPEED_BONUS;
      return s + pts;
    }, 0);
  }

  async function startChallenge() {
    if (challengeSet.isPending) return;
    try {
      // Always ask the server for a brand-new set — never reuse a cached one.
      const set = await challengeSet.mutateAsync({ count: QUESTION_COUNT, exclude: getSeenIds() });
      if (set.questions.length === 0) {
        toast.error("No questions available right now. Add some to the question bank first.");
        return;
      }
      rememberSeenIds(set.questions.map((q) => q.id), set.recycled);
      if (set.recycled) {
        toast.info("You've seen most of the question bank — some older questions are repeating. Add this month's list in Question Bank for fresh ones.");
      }
      setQuestions(set.questions);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load questions. Please try again.");
      return;
    }
    lockRef.current = false;
    setSessionSec(0);
    setPhase("live");
    setQuestionIdx(0);
    setSelected(null);
    setTimeLeft(TIMER_SECONDS);
    setAnswered([]);
    setTotalTimeSec(0);
    setShowConfetti(false);
    questionStartRef.current = Date.now();
  }

  function resetChallenge() {
    lockRef.current = false;
    setPhase("intro");
    setQuestionIdx(0);
    setSelected(null);
    setTimeLeft(TIMER_SECONDS);
    setAnswered([]);
    setTotalTimeSec(0);
    setShowConfetti(false);
  }

  async function shareScore() {
    const score = computeScore();
    const correct = answered.filter((a) => a.correct).length;
    const speedBonuses = answered.filter((a) => a.bonus).length;
    const text = `🎯 BankOS Daily Challenge\n${getToday()}\n\nScore: ${score} pts\n${correct}/${answered.length} correct\n${speedBonuses} speed bonuses 🔥\nStreak: ${streak} days\n\nTry it out!`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Score copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  if (phase === "intro") {
    const alreadyDone = todayRecord !== null;

    return (
      <div className="space-y-6">
        <ViewHeader
          badge="Daily"
          badgeIcon={<Target className="h-3 w-3" />}
          title="Daily Challenge"
          subtitle={`${QUESTION_COUNT} fresh questions, ${TIMER_SECONDS} seconds each. Build your streak and earn speed bonuses.`}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard className="md:col-span-2 p-0 overflow-hidden border-white/10">
            <div className="relative p-6 sm:p-8">
              {/* Background Glow Effect */}
              <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-electric-500/10 blur-[80px] pointer-events-none" />

              <div className="relative z-10 flex flex-col gap-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center text-center sm:text-left">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-violet-500/20 to-electric-500/20 border border-violet-500/30 shadow-[0_0_30px_-10px_rgba(139,92,246,0.5)]"
                  >
                    <Target className="h-12 w-12 text-violet-400" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {alreadyDone ? "Daily Quest Complete!" : "Ready for Today's Quest?"}
                    </h2>
                    <p className="text-sm sm:text-base text-white/50 max-w-lg leading-relaxed">
                      {alreadyDone
                        ? `You've already conquered today's challenge with ${todayRecord.score} pts. Want to beat your score?`
                        : `Test yourself with ${QUESTION_COUNT} brand-new questions — every run is different. Speed earns you bonus points!`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { icon: Check, color: "emerald", label: `+${POINTS_CORRECT} pts`, sub: "Correct answer", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300" },
                    { icon: X, color: "rose", label: `${POINTS_WRONG} pts`, sub: "Wrong / timeout", bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-300" },
                    { icon: Zap, color: "amber", label: `+${SPEED_BONUS} bonus`, sub: `Under ${SPEED_BONUS_THRESHOLD}s`, bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-300" },
                  ].map((rule, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className={cn("flex items-center gap-3 rounded-2xl border p-4 transition-all duration-300", rule.bg, rule.border)}
                    >
                      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-opacity-20", rule.bg.replace('/10', '/20'))}>
                        <rule.icon className={cn("h-5 w-5", rule.text)} />
                      </div>
                      <div>
                        <div className={cn("text-sm font-bold", rule.text)}>{rule.label}</div>
                        <div className="text-[11px] text-white/40">{rule.sub}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139,92,246,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startChallenge}
                    disabled={isLoading}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl px-10 py-4 text-sm font-bold transition-all overflow-hidden",
                      "bg-gradient-to-r from-violet-600 via-violet-500 to-electric-600 text-white",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {/* Pulsing background effect */}
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:animate-pulse" />
                    
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : alreadyDone ? (
                      <RotateCcw className="h-5 w-5" />
                    ) : (
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    )}
                    <span className="relative z-10">
                      {isLoading ? "Preparing questions..." : alreadyDone ? "Retake Challenge" : "Start Challenge"}
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="h-4 w-4 text-white/40" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                Player Stats
              </h3>
            </div>
            
            <div className="flex flex-col gap-6">
              {[
                { icon: Flame, color: "amber", label: "Day streak", value: streak, bg: "bg-amber-500/15", border: "border-amber-500/20", text: "text-amber-400" },
                { icon: Trophy, color: "violet", label: "Best score", value: bestScore, suffix: " pts", bg: "bg-violet-500/15", border: "border-violet-500/20", text: "text-violet-400" },
                { icon: Sparkles, color: "electric", label: "Average score", value: avgScore, suffix: " pts", bg: "bg-electric-500/15", border: "border-electric-500/20", text: "text-electric-400" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl border", stat.bg, stat.border)}>
                    <stat.icon className={cn("h-6 w-6", stat.text)} />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-2xl font-bold text-white tracking-tight">
                      <Counter value={stat.value} duration={0.8} suffix={stat.suffix} />
                    </div>
                    <div className="text-[11px] text-white/40 uppercase tracking-wider">{stat.label}</div>
                  </div>
                </div>
              ))}

              {getHistory().length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-3 text-white/30">
                    <History className="h-3 w-3" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Recent Activity</span>
                  </div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-premium">
                    {getHistory()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 5)
                      .map((r) => (
                        <div key={r.date} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-transparent hover:border-white/10 transition-colors group">
                          <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">{r.date.slice(5)}</span>
                          <span className={cn("text-xs font-bold", r.correct === r.total ? "text-emerald-400" : "text-white/70")}>
                            {r.score} pts · {r.correct}/{r.total}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <QuestionBankPanel perChallenge={QUESTION_COUNT} />
      </div>
    );
  }

  // Live quiz
  if (phase === "live") {
    const q = questions[questionIdx];
    if (!q) return null;
    const currentAnswer = answered[questionIdx];
    const isAnswered = currentAnswer !== undefined;
    const timerPercent = (timeLeft / TIMER_SECONDS) * 100;
    const timerColor =
      timeLeft <= 5 ? "text-rose-400" : timeLeft <= 10 ? "text-amber-400" : "text-emerald-400";

    return (
      <div className="space-y-6">
        <ViewHeader
          badge="Daily"
          badgeIcon={<Target className="h-3 w-3" />}
          title="Daily Challenge"
          subtitle={`Question ${questionIdx + 1} of ${questions.length}`}
        />

        <div className="flex gap-1.5">
          {questions.map((_, i) => {
            let dotColor = "bg-white/10";
            if (i < answered.length) {
              dotColor = answered[i].correct ? "bg-emerald-500" : "bg-rose-500";
            } else if (i === questionIdx) {
              dotColor = "bg-violet-500";
            }
            return (
              <div
                key={i}
                className={cn("h-1.5 flex-1 rounded-full transition-colors duration-500", dotColor)}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className={cn("h-4 w-4", timerColor)} />
            <span className={cn("text-lg font-bold tabular-nums", timerColor)}>
              {timeLeft}s
            </span>
          </div>
          <div className="h-2 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                timeLeft <= 5
                  ? "bg-gradient-to-r from-rose-500 to-rose-400"
                  : timeLeft <= 10
                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                    : "bg-gradient-to-r from-violet-500 to-electric-500"
              )}
              initial={{ width: "100%" }}
              animate={{ width: `${timerPercent}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-white/40" title="Total time so far">
            <span className="hidden sm:inline">Total</span>
            {Math.floor(sessionSec / 60)}:{String(sessionSec % 60).padStart(2, "0")}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={questionIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard className="p-5 sm:p-6" hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                  {q.subject}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/40">
                  {q.difficulty}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-medium leading-relaxed text-white mb-6">
                {q.text}
              </h3>

              <div className="grid gap-3">
                {q.options.map((opt, i) => {
                  const isChosen = selected === i;
                  const isCorrectOption = isAnswered && i === q.answer;
                  const isWrongOption = isAnswered && isChosen && !currentAnswer.correct;

                  let optionStyle =
                    "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]";

                  if (isAnswered) {
                    if (isCorrectOption) {
                      optionStyle = "border-emerald-500/40 bg-emerald-500/10";
                    } else if (isWrongOption) {
                      optionStyle = "border-rose-500/40 bg-rose-500/10";
                    } else {
                      optionStyle = "border-white/[0.04] bg-white/[0.02] opacity-50";
                    }
                  } else if (isChosen) {
                    optionStyle = "border-violet-500/40 bg-violet-500/15";
                  }

                  return (
                    <motion.button
                      key={i}
                      whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                      onClick={() => !isAnswered && handleSelect(i)}
                      disabled={isAnswered || isSubmitting}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 min-h-[52px]",
                        optionStyle,
                        !isAnswered && "cursor-pointer active:scale-[0.98]"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-semibold transition-colors",
                          isCorrectOption
                            ? "bg-emerald-500/20 text-emerald-300"
                            : isWrongOption
                              ? "bg-rose-500/20 text-rose-300"
                              : isAnswered
                                ? "bg-white/5 text-white/30"
                                : "bg-white/[0.06] text-white/60"
                        )}
                      >
                        {isCorrectOption ? (
                          <Check className="h-4 w-4" />
                        ) : isWrongOption ? (
                          <X className="h-4 w-4" />
                        ) : (
                          OPTION_LABELS[i]
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm sm:text-base",
                          isCorrectOption
                            ? "text-emerald-200 font-medium"
                            : isWrongOption
                              ? "text-rose-200"
                              : "text-white/80"
                        )}
                      >
                        {opt}
                      </span>
                      {currentAnswer?.bonus && isCorrectOption && (
                        <span className="ml-auto rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Speed!
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {currentAnswer.correct ? (
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                            <Check className="h-4 w-4" /> Correct!
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-rose-400">
                            <X className="h-4 w-4" /> {selected === -1 ? "Time's up!" : "Incorrect"}
                          </span>
                        )}
                        <span className="text-xs text-white/30 ml-auto">
                          {currentAnswer.timeSec}s
                        </span>
                      </div>
                      <p className="text-sm text-white/50 leading-relaxed">
                        {currentAnswer.explanation}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={nextQuestion}
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-electric-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_-4px_rgba(139,92,246,0.5)] min-h-[48px]"
                      >
                        {questionIdx + 1 >= questions.length ? "See Results" : "Next"}
                        <ChevronRight className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isSubmitting && (
                <div className="absolute inset-0 grid place-items-center rounded-3xl bg-[#070b16]/60 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                </div>
              )}
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (phase === "result") {
    const score = computeScore();
    const correctCount = answered.filter((a) => a.correct).length;
    const speedBonuses = answered.filter((a) => a.bonus).length;
    const accuracyPct = Math.round((correctCount / answered.length) * 100);
    const maxPossible = answered.length * (POINTS_CORRECT + SPEED_BONUS);
    const isPerfect = correctCount === answered.length;

    return (
      <div className="space-y-6">
        {showConfetti && <ConfettiEffect />}

        <ViewHeader
          badge="Complete"
          badgeIcon={<Trophy className="h-3 w-3" />}
          title={isPerfect ? "Perfect Score! 🎯" : "Challenge Complete"}
          subtitle={isPerfect ? "Flawless performance — every answer correct!" : `You scored ${score} points on today's challenge.`}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard className="md:col-span-2 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <Ring
                  value={Math.round((score / Math.max(1, maxPossible)) * 100)}
                  size={180}
                  stroke={14}
                  label={<Counter value={score} duration={1.2} />}
                  sublabel="points"
                  gradientFrom={isPerfect ? "#10b981" : "#8b5cf6"}
                  gradientTo={isPerfect ? "#34d399" : "#22d3ee"}
                />
              </div>

              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                <GlassPanel className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    <Counter value={correctCount} duration={0.8} />
                  </div>
                  <div className="text-xs text-white/40 mt-1">Correct</div>
                </GlassPanel>
                <GlassPanel className="p-4 text-center">
                  <div className="text-2xl font-bold text-rose-400">
                    <Counter value={answered.length - correctCount} duration={0.8} />
                  </div>
                  <div className="text-xs text-white/40 mt-1">Wrong</div>
                </GlassPanel>
                <GlassPanel className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    <Counter value={speedBonuses} duration={0.8} />
                  </div>
                  <div className="text-xs text-white/40 mt-1">Speed Bonus</div>
                </GlassPanel>
                <GlassPanel className="p-4 text-center">
                  <div className="text-2xl font-bold text-electric-400">
                    <Counter value={accuracyPct} duration={0.8} suffix="%" />
                  </div>
                  <div className="text-xs text-white/40 mt-1">Accuracy</div>
                </GlassPanel>
              </div>

              <div className="w-full space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/30 mb-3">
                  Question Breakdown
                </h3>
                {answered.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold",
                        a.correct ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                      )}
                    >
                      {a.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-white/40">
                        Q{i + 1} · {questions[i]?.subject}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.bonus && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          ⚡ {a.timeSec}s
                        </span>
                      )}
                      <span className="text-xs text-white/30">{a.timeSec}s</span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          a.correct ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {a.correct ? `+${POINTS_CORRECT + (a.bonus ? SPEED_BONUS : 0)}` : POINTS_WRONG}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={resetChallenge}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 min-h-[48px]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Back to Home
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={shareScore}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-electric-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_-4px_rgba(139,92,246,0.5)] min-h-[48px]"
                >
                  {copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? "Copied!" : "Share Score"}
                </motion.button>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-6" delay={0.1}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/40">
                Streak
              </h3>
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 border border-amber-500/20">
                  <Flame className="h-8 w-8 text-amber-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    <Counter value={computeStreak()} duration={0.8} />
                  </div>
                  <div className="text-xs text-white/40">Day streak</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6" delay={0.2}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/40">
                All-Time Best
              </h3>
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 border border-violet-500/20">
                  <Trophy className="h-8 w-8 text-violet-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    <Counter value={getBestScore()} duration={0.8} />
                  </div>
                  <div className="text-xs text-white/40">Best score</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6" delay={0.3}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/40">
                Average
              </h3>
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-electric-500/15 border border-electric-500/20">
                  <Sparkles className="h-8 w-8 text-electric-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    <Counter value={getAverageScore()} duration={0.8} />
                  </div>
                  <div className="text-xs text-white/40">Avg score</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
