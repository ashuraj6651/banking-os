"use client";

import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Flame,
  Target,
  Zap,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BookOpen,
  Brain,
  Sigma,
  Newspaper,
  Timer,
  Trophy,
} from "lucide-react";
import { useBankOS } from "@/lib/store";
import {
  useProfileStats,
  useMissions,
  useToggleMission,
  useAnalytics,
  Mission,
} from "@/lib/hooks";
import { Ring, MiniRing } from "../Ring";
import { GlassCard } from "../GlassCard";
import { Counter } from "../Counter";
import { GlowBadge } from "../Primitives";
import { cn } from "@/lib/utils";

const MISSION_ICON: Record<string, typeof BookOpen> = {
  rc: BookOpen,
  puzzle: Brain,
  quant: Sigma,
  current: Newspaper,
  mock: Timer,
};

export function MissionControl() {
  const { startSession, setView } = useBankOS();
  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErrorObj, refetch: refetchStats } = useProfileStats();
  const { data: missionsData, isLoading: missionsLoading, isError: missionsError, error: missionsErrorObj, refetch: refetchMissions } = useMissions();
  const toggleMission = useToggleMission();
  const { data: analytics } = useAnalytics();

  const missions = missionsData?.missions ?? [];
  const doneCount = missions.filter((m) => m.done).length;
  const progress = missions.length ? Math.round((doneCount / missions.length) * 100) : 0;

  const profile = stats?.profile;
  const readiness = stats?.readiness;
  const s = stats?.stats;
  const mastery = analytics?.mastery ?? [];

  if (statsError) {
    console.warn("useProfileStats error:", statsErrorObj);
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="text-center text-white/60">
          <div className="mb-3">Failed to load your profile. Please retry.</div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                refetchStats();
                refetchMissions();
              }}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              Retry
            </button>
            <button
              onClick={() => setView("onboarding")}
              className="rounded-2xl border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
            >
              Open Onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  // show initial loading if profile data or missions are still being fetched
  if (!profile && (statsLoading || missionsLoading)) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="flex items-center gap-3 text-white/50">
          <Sparkles className="h-5 w-5 animate-pulse" /> Loading your mission…
        </div>
      </div>
    );
  }

  // no profile (but not loading) — prompt onboarding
  if (!profile) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="text-center text-white/60">
          <div className="mb-3">No profile found. Complete onboarding to get started.</div>
          <button
            onClick={() => setView("onboarding")}
            className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6">
      {/* ===== Hero greeting ===== */}
      <GlassCard hover={false} className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-electric-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GlowBadge color="violet">
                <Sparkles className="h-3 w-3" /> Mission Control
              </GlowBadge>
              <span className="text-xs text-white/40">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {greeting}, <span className="text-gradient-static">{profile.name}</span>
            </h1>
            <p className="mt-2 text-sm text-white/50">
              You&apos;re preparing for{" "}
              <span className="font-medium text-violet-300">{profile.exam}</span>. Stay locked in —
              every focused hour compounds.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => startSession(missions.find((m) => !m.done))}
                className="shine group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-violet-500 to-electric-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] transition-shadow hover:shadow-[0_10px_40px_-6px_rgba(139,92,246,0.85)]"
              >
                <Zap className="h-4 w-4" />
                Start Focus Session
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => setView("coach")}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4 text-violet-300" />
                Ask AI Coach
              </button>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-5 rounded-2xl border border-white/[0.06] bg-black/20 p-5">
            <div className="text-center">
              <div className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                <Counter value={s?.daysRemaining ?? 0} />
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/40">
                Days to Exam
              </div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Flame className="h-4 w-4 text-amber-400" /> {profile.streak}-day streak
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Trophy className="h-4 w-4 text-violet-300" /> Level {profile.level}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Zap className="h-4 w-4 text-cyan-300" /> {profile.xp.toLocaleString()} XP
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ===== Top metric row ===== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReadinessCard readiness={readiness} />
        <SelectionCard readiness={readiness} />
        <StreakCard streak={profile.streak} />
        <FocusScoreCard readiness={readiness} />
      </div>

      {/* ===== Mission + side column ===== */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Today's mission */}
        <GlassCard className="xl:col-span-2" delay={0.05}>
          <div className="flex items-center justify-between p-6 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Today&apos;s Mission</h2>
              <p className="text-sm text-white/40">
                {doneCount} of {missions.length} complete · {progress}% ready
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
              <Clock className="h-3.5 w-3.5" />
              {missions.reduce((a, m) => a + m.duration, 0)} min total
            </div>
          </div>

          <div className="mx-6 mb-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-electric-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="p-4 pt-3">
            {missionsLoading && (
              <div className="space-y-2 p-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/[0.03]" />
                ))}
              </div>
            )}
            {missions.map((m, i) => {
              const Icon = MISSION_ICON[m.type] ?? BookOpen;
              return (
                <motion.button
                  key={m.id}
                  onClick={() => toggleMission.mutate(m.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i + 0.1 }}
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors",
                    m.done ? "bg-emerald-500/[0.06]" : "hover:bg-white/[0.04]"
                  )}
                >
                  <div
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-all",
                      m.done
                        ? "border-emerald-400/40 bg-emerald-500/20"
                        : "border-white/15 bg-white/[0.03] group-hover:border-violet-400/40"
                    )}
                  >
                    {m.done && <Check className="h-4 w-4 text-emerald-300" />}
                  </div>
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors",
                      m.done
                        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-white/60 group-hover:border-violet-400/30 group-hover:text-violet-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div
                      className={cn(
                        "text-sm font-medium transition-colors",
                        m.done ? "text-white/40 line-through" : "text-white"
                      )}
                    >
                      {m.title}
                    </div>
                    <div className="text-[11px] text-white/35">{m.duration} min · {m.type.toUpperCase()}</div>
                  </div>
                  {!m.done && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        startSession(m);
                      }}
                      className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/50 opacity-0 transition-all group-hover:opacity-100 hover:border-violet-400/40 hover:text-violet-200"
                    >
                      Start →
                    </span>
                  )}
                </motion.button>
              );
            })}
            {missions.length === 0 && !missionsLoading && (
              <div className="p-8 text-center text-sm text-white/40">
                No missions yet. Check back shortly.
              </div>
            )}
          </div>
        </GlassCard>

        {/* Side column */}
        <div className="space-y-6">
          {/* Roadmap briefing */}
          <GlassCard delay={0.1}>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-electric-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white">Your AI Roadmap</h3>
              </div>
              <div className="mt-4 max-h-44 overflow-y-auto pr-1 text-sm leading-relaxed text-white/60 scrollbar-premium">
                <RoadmapText md={profile.roadmap} />
              </div>
              <button
                onClick={() => setView("coach")}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-violet-200"
              >
                Ask your Coach <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </GlassCard>

          {/* Revision due */}
          <GlassCard delay={0.15}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Quick Stats</h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniStat label="Questions" value={s?.attempts ?? 0} color="#8b5cf6" />
                <MiniStat label="Accuracy" value={s?.accuracy ?? 0} suffix="%" color="#22d3ee" />
                <MiniStat label="Sessions" value={s?.sessions ?? 0} color="#10b981" />
                <MiniStat label="Mocks" value={s?.mocks ?? 0} color="#f59e0b" />
              </div>
              <button
                onClick={() => setView("revision")}
                className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-medium text-violet-300 transition-colors hover:bg-white/10"
              >
                Open Revision Engine →
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ===== Subject mastery quick row ===== */}
      <GlassCard hover={false} delay={0.2}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Section Readiness</h3>
            <button
              onClick={() => setView("analytics")}
              className="text-xs font-medium text-violet-300 hover:text-violet-200"
            >
              View analytics →
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {mastery.length === 0 && (
              <div className="col-span-full py-6 text-center text-sm text-white/40">
                Answer some questions to unlock section readiness.
              </div>
            )}
            {mastery.map((sub) => (
              <div key={sub.subject} className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <MiniRing value={sub.mastery} color={sub.color} size={64} stroke={6} />
                <span className="text-xs font-medium text-white/70">{sub.subject}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ===== Daily Goal Tracker ===== */}
      <DailyGoalCard attempts={s?.attempts ?? 0} />
    </div>
  );
}

function DailyGoalCard({ attempts }: { attempts: number }) {
  const DAILY_GOAL = 50;
  const progress = Math.min(Math.round((attempts / DAILY_GOAL) * 100), 100);

  const getMotivation = () => {
    if (progress >= 100) return { msg: "Daily goal achieved! 🎉", color: "text-emerald-300" };
    if (progress >= 75) return { msg: "Almost at your goal!", color: "text-violet-300" };
    if (progress >= 50) return { msg: "Halfway there!", color: "text-cyan-300" };
    if (progress >= 25) return { msg: "Great start, keep going!", color: "text-amber-300" };
    return { msg: "Start your day strong!", color: "text-white/60" };
  };

  const motivation = getMotivation();

  return (
    <GlassCard hover={false} delay={0.25}>
      <div className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Ring
            value={progress}
            size={80}
            stroke={8}
            gradientFrom="#8b5cf6"
            gradientTo="#22d3ee"
            label={`${Math.min(attempts, DAILY_GOAL)}`}
            sublabel="/50"
          />
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-300" />
              <h3 className="text-sm font-semibold text-white">Daily Goal</h3>
            </div>
            <p className="mt-1 text-sm font-medium text-white/80">
              {Math.min(attempts, DAILY_GOAL)}/{DAILY_GOAL} questions today
            </p>
            <p className={`mt-1 text-xs ${motivation.color}`}>
              {motivation.msg}
            </p>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-electric-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function RoadmapText({ md }: { md: string }) {
  // render markdown-lite
  const lines = md.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        const isHead = line.startsWith("**") && line.endsWith("**");
        const clean = line.replace(/\*\*/g, "");
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
              <span>{clean.replace("- ", "")}</span>
            </div>
          );
        }
        return (
          <div key={i} className={isHead ? "font-semibold text-white/80" : ""}>
            {clean}
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({ label, value, suffix, color }: { label: string; value: number; suffix?: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
      <div className="text-xl font-bold" style={{ color }}>
        {value}
        {suffix}
      </div>
      <div className="text-[11px] text-white/40">{label}</div>
    </div>
  );
}

/* ---------- metric cards ---------- */
function ReadinessCard({ readiness }: { readiness?: { overall: number; preparationLevel: string } }) {
  const overall = readiness?.overall ?? 0;
  return (
    <GlassCard delay={0.05} className="relative overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-white/40">Overall Readiness</span>
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Ring value={overall} size={104} stroke={10} label={`${overall}%`} />
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {readiness?.preparationLevel ?? "Beginner"}
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              {overall > 0 ? "Growing" : "Start practicing"}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function SelectionCard({ readiness }: { readiness?: { selectionProbability: number; predictedRank: number | null; expectedCutoff: number; confidence: number } }) {
  return (
    <GlassCard delay={0.1} className="relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-white/40">Selection Probability</span>
          <Target className="h-4 w-4 text-violet-300" />
        </div>
        <div className="mt-4 text-4xl font-bold text-white">
          <Counter value={readiness?.selectionProbability ?? 0} suffix="%" />
        </div>
        <div className="mt-3 space-y-1 text-xs text-white/50">
          <div className="flex justify-between">
            <span>Predicted Rank</span>
            <span className="text-white/80">{readiness?.predictedRank ? `#${readiness.predictedRank}` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Expected Cutoff</span>
            <span className="text-white/80">{readiness?.expectedCutoff ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Confidence</span>
            <span className="text-emerald-300">{readiness?.confidence ?? 0}%</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function StreakCard({ streak }: { streak: number }) {
  return (
    <GlassCard delay={0.15} className="relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-2xl" />
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-white/40">Current Streak</span>
          <Flame className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-4xl font-bold text-white">
            <Counter value={streak} />
          </span>
          <span className="mb-1 text-sm text-white/40">days</span>
        </div>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-6 flex-1 rounded-sm",
                i < Math.min(streak, 14) ? "bg-gradient-to-t from-amber-500/40 to-amber-400/80" : "bg-white/[0.06]"
              )}
            />
          ))}
        </div>
        <div className="mt-2 text-xs text-white/40">
          {streak === 0 ? "Complete a session to start your streak" : "Keep it alive today"}
        </div>
      </div>
    </GlassCard>
  );
}

function FocusScoreCard({ readiness }: { readiness?: { focusScore: number } }) {
  const score = readiness?.focusScore ?? 0;
  return (
    <GlassCard delay={0.2} className="relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl" />
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-white/40">Focus Score</span>
          <Zap className="h-4 w-4 text-cyan-300" />
        </div>
        <div className="mt-4 text-4xl font-bold text-white">
          <Counter value={score} />
          <span className="text-lg text-white/40">/100</span>
        </div>
        <div className="mt-3 space-y-1.5 text-xs text-white/50">
          <div className="flex justify-between">
            <span>Status</span>
            <span className={score > 0 ? "text-emerald-300" : "text-white/60"}>
              {score > 70 ? "In flow" : score > 0 ? "Warming up" : "Idle"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tip</span>
            <span className="text-white/70">Run a focus session</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
