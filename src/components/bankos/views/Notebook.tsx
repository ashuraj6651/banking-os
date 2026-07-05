"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NotebookPen, Brain, Clock, Zap, HelpCircle, Check, Loader2 } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { useErrors, useToggleErrorReviewed } from "@/lib/hooks";

const REASON_META: Record<string, { icon: typeof Brain; color: string; label: string; rec: string }> = {
  Concept: { icon: Brain, color: "#8b5cf6", label: "Concept Gap", rec: "Relearn the core concept, then redo 5 similar questions." },
  Careless: { icon: Zap, color: "#f59e0b", label: "Careless Slip", rec: "Slow down on option-reading. Use the notebook flag." },
  Time: { icon: Clock, color: "#22d3ee", label: "Time Pressure", rec: "Drill timed sets of 10 to build speed intuition." },
  Guess: { icon: HelpCircle, color: "#ec4899", label: "Educated Guess", rec: "Eliminate 2 options, then skip — don't gamble." },
};

const FILTERS = ["All", "Concept", "Careless", "Time", "Guess"] as const;

export function Notebook() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const { data, isLoading } = useErrors();
  const toggle = useToggleErrorReviewed();

  const errors = data?.errors ?? [];
  const items = errors.filter((e) => filter === "All" || e.reason === filter);

  const counts = {
    Concept: errors.filter((e) => e.reason === "Concept").length,
    Careless: errors.filter((e) => e.reason === "Careless").length,
    Time: errors.filter((e) => e.reason === "Time").length,
    Guess: errors.filter((e) => e.reason === "Guess").length,
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        badge="Refine"
        badgeIcon={<NotebookPen className="h-3 w-3" />}
        title="AI Error Notebook"
        subtitle="Every wrong answer is captured, classified and turned into a recommendation."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["Concept", "Careless", "Time", "Guess"] as const).map((r) => {
          const meta = REASON_META[r];
          const Icon = meta.icon;
          return (
            <GlassCard key={r}>
              <div className="flex items-center gap-4 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{counts[r]}</div>
                  <div className="text-xs text-white/40">{meta.label}</div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? "border-violet-400/40 bg-violet-500/15 text-violet-200" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your errors…
        </div>
      )}

      {items.length === 0 && !isLoading && (
        <GlassCard hover={false}>
          <div className="p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10">
              <Check className="h-7 w-7 text-emerald-300" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">No errors yet</h3>
            <p className="mt-1.5 text-sm text-white/50">Wrong answers land here automatically. Stay accurate and this stays empty.</p>
          </div>
        </GlassCard>
      )}

      <div className="space-y-4">
        {items.map((e, i) => {
          const meta = REASON_META[e.reason] ?? REASON_META.Concept;
          const Icon = meta.icon;
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard hover={false}>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg border px-2.5 py-1 text-[11px] font-medium text-violet-200" style={{ borderColor: `${meta.color}55`, background: `${meta.color}1a`, color: meta.color }}>
                        {e.subject}
                      </span>
                      <span className="text-xs text-white/35">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: `${meta.color}55`, background: `${meta.color}1a`, color: meta.color }}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{e.question}</p>
                  <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">AI Recommendation</div>
                    <p className="mt-1 text-sm text-white/70">{meta.rec}</p>
                  </div>
                  <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Correct Explanation</div>
                    <p className="mt-1 text-sm text-white/70">{e.explanation}</p>
                  </div>
                  <button
                    onClick={() => toggle.mutate(e.id)}
                    className={`mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${e.reviewed ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"}`}
                  >
                    <Check className="h-3.5 w-3.5" /> {e.reviewed ? "Reviewed" : "Mark reviewed"}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
