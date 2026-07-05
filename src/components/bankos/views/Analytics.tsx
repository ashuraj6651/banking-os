"use client";

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
import { BarChart3, TrendingUp, Clock, Target, ArrowUpRight } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { Counter } from "../Counter";
import { useAnalytics } from "@/lib/hooks";

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
        <KpiCard label="Total Study Hours" value={totalHours} suffix="h" icon={Clock} color="#8b5cf6" trend="real" />
        <KpiCard label="Avg Accuracy" value={accuracy} suffix="%" icon={Target} color="#22d3ee" trend="real" />
        <KpiCard label="Questions Solved" value={totalAttempts} icon={TrendingUp} color="#3b82f6" trend="real" />
        <KpiCard label="Mocks Taken" value={mocksTaken} icon={BarChart3} color="#ec4899" trend="real" />
      </div>

      {totalAttempts === 0 ? (
        <GlassCard hover={false}>
          <div className="p-10 text-center text-sm text-white/50">
            No data yet. Answer a few questions or run a focus session to populate your analytics.
          </div>
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <GlassCard className="lg:col-span-2" hover={false}>
              <div className="p-6">
                <ChartHeader title="Study Hours & Accuracy" subtitle="Last 14 days" />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="section" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="time" radius={[6, 6, 0, 0]} name="Avg time (s)">
                          {sectionTime.map((_, i) => (
                            <Cell key={i} fill={["#8b5cf6", "#22d3ee", "#3b82f6", "#ec4899", "#10b981"][i % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard>
              <div className="p-6">
                <ChartHeader title="Strong Areas" subtitle="Topics you've mastered" accent="emerald" />
                {strong.length === 0 ? (
                  <div className="py-6 text-center text-sm text-white/40">No data yet.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {strong.map((s) => <SkillBar key={s.topic} label={s.topic} value={s.mastery} color="#10b981" />)}
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
                    {weak.map((s) => <SkillBar key={s.topic} label={s.topic} value={s.mastery} color="#f43f5e" />)}
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

function EmptyAnalytics() {
  return (
    <div className="space-y-6">
      <ViewHeader badge="Insights" badgeIcon={<BarChart3 className="h-3 w-3" />} title="Analytics" subtitle="Your data will appear here as you practice." />
      <GlassCard hover={false}>
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
        <div className="mt-4 text-3xl font-bold text-white">
          <Counter value={value} suffix={suffix} />
        </div>
        <div className="mt-1 text-xs text-white/40">{label}</div>
      </div>
    </GlassCard>
  );
}

function ChartHeader({ title, subtitle, accent }: { title: string; subtitle: string; accent?: "violet" | "emerald" | "rose" }) {
  const dot = accent === "emerald" ? "bg-emerald-400" : accent === "rose" ? "bg-rose-400" : "bg-violet-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/40">{subtitle}</p>
      </div>
    </div>
  );
}

function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-medium text-white">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full" style={{ background: color, width: `${value}%` }} />
      </div>
    </div>
  );
}
