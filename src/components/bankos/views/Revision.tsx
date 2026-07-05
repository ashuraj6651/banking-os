"use client";

import { motion } from "framer-motion";
import { RefreshCw, Clock, Brain, ChevronRight, Zap, Loader2, Check } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { useRevision, useReviewItem } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Revision() {
  const { data, isLoading } = useRevision();
  const review = useReviewItem();
  const items = data?.items ?? [];
  const dueToday = items.filter((i) => i.due === "Today").length;

  async function handleReview(id: string) {
    try {
      await review.mutateAsync(id);
      toast.success("Reviewed — strength increased");
    } catch {
      toast.error("Could not update");
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        badge="Spaced Repetition"
        badgeIcon={<RefreshCw className="h-3 w-3" />}
        title="Revision Engine"
        subtitle="AI schedules your revision automatically. Never forget a concept again."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard>
          <div className="p-5">
            <Clock className="h-5 w-5 text-amber-300" />
            <div className="mt-3 text-3xl font-bold text-white">{dueToday}</div>
            <div className="text-xs text-white/40">Due today</div>
          </div>
        </GlassCard>
        <GlassCard delay={0.05}>
          <div className="p-5">
            <Brain className="h-5 w-5 text-violet-300" />
            <div className="mt-3 text-3xl font-bold text-white">{items.length}</div>
            <div className="text-xs text-white/40">Concepts tracked</div>
          </div>
        </GlassCard>
        <GlassCard delay={0.1}>
          <div className="p-5">
            <Zap className="h-5 w-5 text-emerald-300" />
            <div className="mt-3 text-3xl font-bold text-white">
              {items.length > 0 ? Math.round(items.reduce((a, i) => a + i.strength, 0) / items.length) : 0}%
            </div>
            <div className="text-xs text-white/40">Avg retention</div>
          </div>
        </GlassCard>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading revision queue…
        </div>
      )}

      {items.length === 0 && !isLoading && (
        <GlassCard hover={false}>
          <div className="p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10">
              <Brain className="h-7 w-7 text-violet-300" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">No revision queued</h3>
            <p className="mt-1.5 text-sm text-white/50">When you answer a question wrong, the topic appears here for spaced revision.</p>
          </div>
        </GlassCard>
      )}

      {items.length > 0 && (
        <GlassCard hover={false}>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Revision Queue</h3>
            <div className="mt-4 space-y-2">
              {items.map((r, i) => {
                const due = r.due === "Today";
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border p-4 transition-colors",
                      due ? "border-amber-400/20 bg-amber-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"
                    )}
                  >
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border", due ? "border-amber-400/30 bg-amber-500/10 text-amber-300" : "border-white/10 bg-white/[0.03] text-white/50")}>
                      <Brain className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{r.topic}</span>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">{r.subject}</span>
                        {due && <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">DUE NOW</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-white/40">
                        <span>Due: {r.due}</span>
                        <span>· Interval: {r.interval} days</span>
                        <span>· Strength: {r.strength}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div className={cn("h-full rounded-full", r.strength >= 70 ? "bg-emerald-400" : r.strength >= 40 ? "bg-amber-400" : "bg-rose-400")} style={{ width: `${r.strength}%` }} />
                      </div>
                    </div>
                    <button
                      onClick={() => handleReview(r.id)}
                      disabled={review.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-violet-400/40 hover:text-violet-200 disabled:opacity-50"
                    >
                      {r.strength >= 80 ? <Check className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      Review
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
