"use client";

import { motion } from "framer-motion";
import { Network, Lock, Check, ChevronRight, Loader2 } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { MiniRing } from "../Ring";
import { useSkillTree } from "@/lib/hooks";
import { useBankOS as useBOS } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SkillTree() {
  const { startSession } = useBOS();
  const { data, isLoading } = useSkillTree();
  const tree = data?.tree ?? [];

  return (
    <div className="space-y-6">
      <ViewHeader badge="Mastery" badgeIcon={<Network className="h-3 w-3" />} title="Skill Tree" subtitle="Every topic is a node. Mastery is computed from your real attempts." />

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading skill tree…
        </div>
      )}

      {tree.length === 0 && !isLoading && (
        <GlassCard hover={false}>
          <div className="p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10">
              <Network className="h-7 w-7 text-violet-300" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">No mastery data yet</h3>
            <p className="mt-1.5 text-sm text-white/50">Answer questions in Practice or Focus Mode to build your skill tree.</p>
          </div>
        </GlassCard>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {tree.map((root, i) => (
          <GlassCard key={root.id} delay={i * 0.08}>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-electric-500/20">
                  <Network className="h-5 w-5 text-violet-200" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white">{root.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                      <motion.div className="h-full rounded-full" style={{ background: root.color, width: `${root.mastery}%` }} initial={{ width: 0 }} whileInView={{ width: `${root.mastery}%` }} viewport={{ once: true }} transition={{ duration: 1 }} />
                    </div>
                    <span className="text-xs text-white/40">{root.mastery}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {root.children.length === 0 && (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center text-xs text-white/30">
                    No attempts in this subject yet
                  </div>
                )}
                {root.children.map((child) => (
                  <div key={child.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center gap-3">
                      <MiniRing value={child.mastery} size={38} stroke={4} color={root.color} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-medium", child.unlocked ? "text-white" : "text-white/40")}>{child.name}</span>
                          {child.mastery >= 90 && child.attempts >= 3 && (
                            <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/20">
                              <Check className="h-2.5 w-2.5 text-emerald-300" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-white/35">
                          {child.attempts > 0 ? `${child.mastery}% · ${child.attempts} attempts` : "Not attempted"}
                        </div>
                      </div>
                      <button onClick={() => startSession()} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-violet-400/40 hover:text-violet-200">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
