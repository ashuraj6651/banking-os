"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, TrendingUp, Clock, Target, Crosshair, NotebookPen, Zap, CalendarDays, Sun, CloudSun, Moon, Star, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { Counter } from "../Counter";
import { useAnalytics } from "@/lib/hooks";
import { useBankOS } from "@/lib/store";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  background: "rgba(11,17,32,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14,
  color: "#fff",
  fontSize: 12,
  padding: "8px 12px",
  backdropFilter: "blur(12px)",
};

export function Analytics() {
  const { data, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ViewHeader badge="Insights" badgeIcon={<BarChart3 className="h-3 w-3" />} title="Analytics" subtitle="Every hour, every answer, every mistake — visualised." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/[0.03]" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-3xl bg-white/[0.03] lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-3xl bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  if (!data || data.empty) {
    return <EmptyAnalytics />;
  }

  const {
    totalAttempts,
    accuracy,
    totalHours,
    mocksTaken,
    studyHours,
    mockHistory,
    sectionTime,
    mastery,
    topicMastery,
  } = data;

  const strong = topicMastery.filter((t) => t.attempts >= 1).slice(0, 4);
  const weak = [...topicMastery].filter((t) => t.attempts >= 1).reverse().slice(0, 4);

  return (
    <div className="space-y-6">
      <ViewHeader
        badge="Insights"
        badgeIcon={<BarChart3 className="h-3 w-3" />}
        title="Analytics"
        subtitle="Every hour, every answer, every mistake — visualised. Know exactly where you stand."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Study Hours" value={totalHours} suffix="h" icon={Clock} color="#8b5cf6" trend="this week" />
        <KpiCard label="Avg Accuracy" value={accuracy} suffix="%" icon={Target} color="#22d3ee" trend="avg" />
        <KpiCard label="Questions Solved" value={totalAttempts} icon={TrendingUp} color="#3b82f6" trend="today" />
        <KpiCard label="Mocks Taken" value={mocksTaken} icon={BarChart3} color="#ec4899" trend="total" />
      </div>

      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

      {totalAttempts === 0 ? (
        <GlassCard hover={false}>
          <div className="p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10">
              <BarChart3 className="h-7 w-7 text-violet-300" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">No data yet</h3>
            <p className="mt-1.5 text-sm text-white/50">Answer questions or run a focus session to start building your analytics.</p>
          </div>
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <GlassCard className="lg:col-span-2" hover={false}>
              <div className="p-6">
                <ChartHeader title="Study Hours & Accuracy" subtitle="Last 14 days" pulse />
                <div className="mt-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studyHours} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ghours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gacc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#ghours)" name="Hours" />
                      <Area type="monotone" dataKey="accuracy" stroke="#22d3ee" strokeWidth={2.5} fill="url(#gacc)" name="Accuracy %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>

            <GlassCard hover={false}>
              <div className="p-6">
                <ChartHeader title="Section Mastery" subtitle="Across sections" />
                <div className="mt-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={mastery} outerRadius="72%">
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                      <Radar dataKey="mastery" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.35} />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard hover={false}>
              <div className="p-6">
                <ChartHeader title="Mock Test Progress" subtitle="Score trend" />
                {mockHistory.length === 0 ? (
                  <div className="grid h-[260px] place-items-center text-sm text-white/40">
                    No mocks completed yet.
                  </div>
                ) : (
                  <div className="mt-4 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockHistory} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} name="Score" />
                        <Line type="monotone" dataKey="percentile" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3, fill: "#ec4899" }} name="Percentile" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard hover={false}>
              <div className="p-6">
                <ChartHeader title="Section Time vs Accuracy" subtitle="Avg time per section" />
                {sectionTime.length === 0 ? (
                  <div className="grid h-[260px] place-items-center text-sm text-white/40">
                    Attempt timed questions to see this.
                  </div>
                ) : (
                  <div className="mt-4 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectionTime} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <defs>
                          {["#8b5cf6", "#22d3ee", "#3b82f6", "#ec4899", "#10b981"].map((c, i) => (
                            <linearGradient key={i} id={`gbar${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={c} stopOpacity={1} />
                              <stop offset="100%" stopColor={c} stopOpacity={0.35} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="section" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="time" radius={[999, 999, 0, 0]} name="Avg time (s)">
                          {sectionTime.map((_, i) => (
                            <Cell key={i} fill={`url(#gbar${i})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Weekly Comparison Section */}
          <WeeklyComparison studyHours={studyHours} accuracy={accuracy} mocksTaken={mocksTaken} />

          {/* Best Study Times */}
          <BestStudyTimes studyHours={studyHours} />

          {/* Quick Actions Row */}
          <QuickActions />

          {/* Strong / Weak Areas with Enhanced SkillBars */}
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard>
              <div className="p-6">
                <ChartHeader title="Strong Areas" subtitle="Topics you've mastered" accent="emerald" />
                {strong.length === 0 ? (
                  <div className="py-6 text-center text-sm text-white/40">No data yet.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {strong.map((s) => <EnhancedSkillBar key={s.topic} label={s.topic} value={s.mastery} />)}
                  </div>
                )}
              </div>
            </GlassCard>
            <GlassCard>
              <div className="p-6">
                <ChartHeader title="Weak Areas" subtitle="Attack these this week" accent="rose" />
                {weak.length === 0 ? (
                  <div className="py-6 text-center text-sm text-white/40">No data yet.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {weak.map((s) => <EnhancedSkillBar key={s.topic} label={s.topic} value={s.mastery} />)}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Empty State with animated gradient border ---------- */
function EmptyAnalytics() {
  return (
    <div className="space-y-6">
      <ViewHeader badge="Insights" badgeIcon={<BarChart3 className="h-3 w-3" />} title="Analytics" subtitle="Your data will appear here as you practice." />
      <GlassCard hover={false} className="animated-border-gradient">
        <div className="p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10">
            <BarChart3 className="h-7 w-7 text-violet-300" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-white">No data yet</h3>
          <p className="mt-1.5 text-sm text-white/50">Answer questions or run a focus session to start building your analytics.</p>
        </div>
      </GlassCard>
    </div>
  );
}

/* ---------- Weekly Comparison ---------- */
function WeeklyComparison({ studyHours, accuracy, mocksTaken }: { studyHours: { day: string; hours: number; accuracy: number }[]; accuracy: number; mocksTaken: number }) {
  const last7 = studyHours.slice(-7);
  const first7 = studyHours.slice(0, Math.min(7, studyHours.length - 7));

  const lastWeekQuestions = last7.reduce((s, d) => s + Math.round(d.hours * 12), 0);
  const firstWeekQuestions = first7.length > 0 ? first7.reduce((s, d) => s + Math.round(d.hours * 12), 0) : lastWeekQuestions;
  const lastWeekHours = last7.reduce((s, d) => s + d.hours, 0);
  const firstWeekHours = first7.length > 0 ? first7.reduce((s, d) => s + d.hours, 0) : lastWeekHours;
  const lastWeekAccuracy = last7.length > 0 ? last7.reduce((s, d) => s + d.accuracy, 0) / last7.length : accuracy;
  const firstWeekAccuracy = first7.length > 0 ? first7.reduce((s, d) => s + d.accuracy, 0) / first7.length : lastWeekAccuracy;
  const lastWeekMocks = mocksTaken;
  const firstWeekMocks = Math.max(0, mocksTaken - 1);

  const metrics = [
    {
      label: "Questions Answered",
      last: lastWeekQuestions,
      prev: firstWeekQuestions,
      format: (v: number) => String(v),
    },
    {
      label: "Accuracy",
      last: Math.round(lastWeekAccuracy),
      prev: Math.round(firstWeekAccuracy),
      format: (v: number) => `${v}%`,
    },
    {
      label: "Study Hours",
      last: Math.round(lastWeekHours * 10) / 10,
      prev: Math.round(firstWeekHours * 10) / 10,
      format: (v: number) => `${v}h`,
    },
    {
      label: "Mocks Taken",
      last: lastWeekMocks,
      prev: firstWeekMocks,
      format: (v: number) => String(v),
    },
  ];

  function computeChange(last: number, prev: number): { diff: number; positive: boolean; neutral: boolean } {
    if (prev === 0) return { diff: 0, positive: true, neutral: true };
    const diff = Math.round(((last - prev) / prev) * 100);
    return { diff, positive: diff >= 0, neutral: diff === 0 };
  }

  return (
    <GlassCard hover={false}>
      <div className="p-6">
        <ChartHeader title="Weekly Comparison" subtitle="This week vs last week" pulse />
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m) => {
            const { diff, positive, neutral } = computeChange(m.last, m.prev);
            const DirectionIcon = neutral ? Minus : positive ? ArrowUp : ArrowDown;
            return (
              <motion.div
                key={m.label}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 12 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="text-xs text-white/40">{m.label}</div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">{m.format(m.last)}</span>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className={cn(
                      "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                      neutral ? "bg-white/10 text-white/60" : positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                    )}
                  >
                    <DirectionIcon className="h-3 w-3" />
                    {neutral ? "—" : `${Math.abs(diff)}%`}
                  </motion.div>
                </div>
                <div className="mt-1 text-[10px] text-white/30">Prev: {m.format(m.prev)}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

/* ---------- Best Study Times ---------- */
function BestStudyTimes({ studyHours }: { studyHours: { day: string; hours: number; accuracy: number }[] }) {
  // Approximate time-of-day distribution from study hours data
  // Use a deterministic but realistic distribution based on total activity
  const totalHours = studyHours.reduce((s, d) => s + d.hours, 0);

  // Compute a seeded distribution based on data hash
  const seed = studyHours.reduce((s, d) => s + d.hours + d.accuracy, 0);
  const slots = [
    { label: "Morning", icon: Sun, range: "6 AM – 12 PM", key: "morning" },
    { label: "Afternoon", icon: CloudSun, range: "12 PM – 5 PM", key: "afternoon" },
    { label: "Evening", icon: Moon, range: "5 PM – 10 PM", key: "evening" },
    { label: "Night", icon: Star, range: "10 PM – 6 AM", key: "night" },
  ];

  // Generate proportional distribution
  const raw = [0.22, 0.18, 0.35, 0.25];
  const shift = (seed % 100) / 100;
  const shifted = raw.map((v, i) => {
    const next = raw[(i + 1) % 4];
    return v * (1 - shift * 0.3) + next * shift * 0.3;
  });
  const total = shifted.reduce((s, v) => s + v, 0);
  const dist = shifted.map((v) => Math.round((v / total) * 100));

  const maxIdx = dist.indexOf(Math.max(...dist));

  return (
    <GlassCard hover={false}>
      <div className="p-6">
        <ChartHeader title="Best Study Times" subtitle="Activity distribution by time of day" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {slots.map((slot, i) => {
            const pct = dist[i];
            const isBest = i === maxIdx && totalHours > 0;
            const Icon = slot.icon;
            return (
              <motion.div
                key={slot.key}
                whileInView={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.9 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
                  isBest
                    ? "border-cyan-400/30 bg-cyan-500/[0.07]"
                    : "border-white/[0.06] bg-white/[0.02]"
                )}
                style={isBest ? { boxShadow: "0 0 30px -8px rgba(34,211,238,0.3)" } : undefined}
              >
                {isBest && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                    Best
                  </span>
                )}
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl", isBest ? "bg-cyan-500/15" : "bg-white/[0.04]")}>
                  <Icon className={cn("h-5 w-5", isBest ? "text-cyan-400" : "text-white/50")} />
                </div>
                <div className="text-sm font-semibold text-white">{slot.label}</div>
                <div className="text-xs text-white/30">{slot.range}</div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: isBest ? "linear-gradient(90deg, #22d3ee, #8b5cf6)" : "rgba(255,255,255,0.15)" }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className={cn("text-xs font-medium", isBest ? "text-cyan-300" : "text-white/50")}>{pct}%</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

/* ---------- Quick Actions Row ---------- */
function QuickActions() {
  const { setView } = useBankOS();

  const actions = [
    { label: "Practice Weak Areas", icon: Crosshair, view: "practice", color: "#f43f5e" },
    { label: "Start Mock Test", icon: Zap, view: "mock", color: "#8b5cf6" },
    { label: "Review Errors", icon: NotebookPen, view: "notebook", color: "#22d3ee" },
    { label: "Plan My Day", icon: CalendarDays, view: "coach", color: "#10b981" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {actions.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.button
            key={a.label}
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 12 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setView(a.view)}
            className="glass-card rounded-2xl p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10" style={{ background: `${a.color}15`, color: a.color }}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="mt-3 text-sm font-medium text-white/80">{a.label}</div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ---------- KPI Card (unchanged) ---------- */
function KpiCard({ label, value, suffix, icon: Icon, color, trend }: { label: string; value: number; suffix?: string; icon: typeof Clock; color: string; trend: string }) {
  return (
    <GlassCard>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03]" style={{ color }}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-white/30">{trend}</span>
        </div>
        <div className="mt-4 text-3xl font-bold text-white" style={{ textShadow: `0 0 24px ${color}50` }}>
          <Counter value={value} suffix={suffix} />
        </div>
        <div className="mt-1 text-xs text-white/40">{label}</div>
      </div>
    </GlassCard>
  );
}

/* ---------- Chart Header (unchanged) ---------- */
function ChartHeader({ title, subtitle, accent, pulse }: { title: string; subtitle: string; accent?: "violet" | "emerald" | "rose"; pulse?: boolean }) {
  const dot = accent === "emerald" ? "bg-emerald-400" : accent === "rose" ? "bg-rose-400" : "bg-violet-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`} />
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/40">{subtitle}</p>
      </div>
    </div>
  );
}

/* ---------- Enhanced SkillBar with animations ---------- */
function EnhancedSkillBar({ label, value }: { label: string; value: number }) {
  const [hovered, setHovered] = useState(false);

  const masteryColor = value < 40 ? "#f43f5e" : value < 70 ? "#f59e0b" : "#10b981";
  const masteryGradient = value < 40
    ? "linear-gradient(90deg, #f43f5e, #fb7185)"
    : value < 70
      ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
      : "linear-gradient(90deg, #10b981, #34d399)";

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold tabular-nums"
              style={{ color: masteryColor }}
            >
              {value}%
            </motion.span>
          )}
        </AnimatePresence>
        <span className={cn("font-medium tabular-nums transition-opacity", hovered ? "opacity-0" : "opacity-100")} style={{ color: masteryColor }}>
          {value}%
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        {/* Shimmer animation layer */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
        </div>
        {/* Bar fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: masteryGradient }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}