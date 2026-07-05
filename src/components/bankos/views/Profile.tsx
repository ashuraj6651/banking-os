"use client";

import { motion } from "framer-motion";
import { User, Trophy, Flame, Zap, Target, Crown, Flag, Sparkles, Award, Loader2 } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { Ring } from "../Ring";
import { Counter } from "../Counter";
import { useProfileStats } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const ACHIEVEMENTS = [
  { key: "first-session", name: "First Session", desc: "Completed your first focus session", icon: "Flag" },
  { key: "100-questions", name: "100 Questions", desc: "Solved 100 practice questions", icon: "Award" },
  { key: "first-mock", name: "First Mock", desc: "Attempted your first mock test", icon: "Flag" },
  { key: "streak-7", name: "7-Day Streak", desc: "Studied 7 days in a row", icon: "Flame" },
  { key: "90-accuracy", name: "90% Accuracy", desc: "Hit 90% accuracy (20+ attempts)", icon: "Target" },
  { key: "1000-questions", name: "1000 Questions", desc: "Solved 1000 practice questions", icon: "Trophy" },
  { key: "streak-30", name: "30-Day Streak", desc: "Studied 30 days in a row", icon: "Flame" },
  { key: "level-10", name: "Level 10", desc: "Reached level 10", icon: "Crown" },
];

const ACH_ICON: Record<string, typeof Trophy> = { Trophy, Flame, Target, Crown, Flag, Sparkles, Award };

const HEAT_COLOR = ["bg-white/[0.04]", "bg-violet-500/30", "bg-violet-500/55", "bg-violet-400/75", "bg-violet-300"];

export function Profile() {
  const { data, isLoading } = useProfileStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-white/40">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading profile…
      </div>
    );
  }

  if (!data || !data.profile) {
    return <div className="py-24 text-center text-white/40">No profile found.</div>;
  }

  const { profile } = data;
  const s = data.stats ?? { attempts: 0, accuracy: 0, sessions: 0, mocks: 0, daysRemaining: 0, achievements: [] as string[] };
  const r = data.readiness ?? { overall: 0, selectionProbability: 0, predictedRank: null, expectedCutoff: 0, preparationLevel: "Beginner", confidence: 0, focusScore: 0 };
  const h = data.heatmap ?? [];
  const xpToNext = profile.level * 1000;
  const unlocked = new Set(s.achievements);

  return (
    <div className="space-y-6">
      <ViewHeader badge="Account" badgeIcon={<User className="h-3 w-3" />} title="Profile" subtitle="Your journey, visualised — all from real activity." />

      {/* hero */}
      <GlassCard hover={false} className="relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
          <div className="relative">
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 via-electric-500 to-cyan-400 text-3xl font-bold text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.7)]">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 rounded-full border-2 border-[#0b1120] bg-gradient-to-br from-amber-400 to-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">
              LVL {profile.level}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
            <p className="mt-1 text-sm text-white/50">Preparing for {profile.exam} · {s.daysRemaining} days to exam</p>
            <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-electric-500 to-cyan-400" initial={{ width: 0 }} whileInView={{ width: `${(profile.xp % xpToNext) / xpToNext * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <div className="mt-1.5 text-xs text-white/40">
              <Counter value={profile.xp % xpToNext} /> / {xpToNext.toLocaleString()} XP to Level {profile.level + 1}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Stat icon={Flame} value={profile.streak} label="Streak" color="#f59e0b" />
            <Stat icon={Trophy} value={profile.coins} label="Coins" color="#8b5cf6" />
            <Stat icon={Zap} value={s.attempts} label="Solved" color="#22d3ee" />
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard>
          <div className="flex flex-col items-center p-6">
            <Ring value={r.overall} size={140} stroke={12} label={`${r.overall}%`} sublabel="Readiness" />
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-lg font-bold text-emerald-300">{r.selectionProbability}%</div>
                <div className="text-[11px] text-white/40">Selection</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-lg font-bold text-violet-300">{r.predictedRank ? `#${r.predictedRank}` : "—"}</div>
                <div className="text-[11px] text-white/40">Predicted rank</div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Activity Heatmap</h3>
              <span className="text-xs text-white/40">Last 12 weeks</span>
            </div>
            <div className="mt-4 flex gap-1 overflow-x-auto no-scrollbar">
              {Array.from({ length: 12 }).map((_, week) => (
                <div key={week} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, day) => {
                    const v = h[week * 7 + day] ?? 0;
                    return <div key={day} className={cn("h-3 w-3 rounded-sm", HEAT_COLOR[v])} title={`${v} sessions`} />;
                  })}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-white/40">
              Less
              {HEAT_COLOR.map((c, i) => <span key={i} className={cn("h-3 w-3 rounded-sm", c)} />)}
              More
            </div>
          </div>
        </GlassCard>
      </div>

      {/* achievements */}
      <GlassCard hover={false}>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-white">Achievements</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACHIEVEMENTS.map((a, i) => {
              const Icon = ACH_ICON[a.icon] ?? Trophy;
              const got = unlocked.has(a.key);
              return (
                <motion.div key={a.key} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className={cn("flex items-center gap-3 rounded-2xl border p-4", got ? "border-violet-400/20 bg-violet-500/[0.06]" : "border-white/[0.06] bg-white/[0.02] opacity-50")}>
                  <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl border", got ? "border-violet-400/30 bg-gradient-to-br from-violet-500/30 to-electric-500/20 text-violet-200" : "border-white/10 bg-white/[0.03] text-white/30")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{a.name}</div>
                    <div className="text-xs text-white/40">{a.desc}</div>
                  </div>
                  {got && <Zap className="h-4 w-4 text-amber-300" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* goals */}
      <GlassCard hover={false}>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-white">Goals</h3>
          <div className="mt-4 space-y-3">
            {[
              { g: "Solve 100 questions", cur: Math.min(s.attempts, 100), total: 100, color: "#8b5cf6" },
              { g: "Hit 80% accuracy", cur: Math.min(s.accuracy, 80), total: 80, color: "#22d3ee" },
              { g: "Complete 5 mocks", cur: Math.min(s.mocks, 5), total: 5, color: "#f59e0b" },
              { g: "Maintain 7-day streak", cur: Math.min(profile.streak, 7), total: 7, color: "#10b981" },
            ].map((goal) => (
              <div key={goal.g}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-white/70">{goal.g}</span>
                  <span className="text-white/50"><Counter value={goal.cur} /> / {goal.total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div className="h-full rounded-full" style={{ background: goal.color }} initial={{ width: 0 }} whileInView={{ width: `${(goal.cur / goal.total) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function Stat({ icon: Icon, value, label, color }: { icon: typeof Flame; value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <Icon className="h-5 w-5" style={{ color }} />
      <div className="mt-2 text-xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-[11px] text-white/40">{label}</div>
    </div>
  );
}
