"use client";

import { motion } from "framer-motion";
import { Brain, Sigma, BookOpen, Newspaper, Building2, Lock, ArrowRight, Loader2 } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { Ring } from "../Ring";
import { useWorld } from "@/lib/hooks";
import { useBankOS } from "@/lib/store";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Brain> = { Brain, Sigma, BookOpen, Newspaper, Building2 };

const POSITIONS: Record<string, { top: string; left: string }> = {
  "reasoning-city": { top: "18%", left: "24%" },
  "quant-valley": { top: "44%", left: "58%" },
  "english-kingdom": { top: "62%", left: "30%" },
  "current-district": { top: "30%", left: "70%" },
  "interview-tower": { top: "12%", left: "76%" },
};

export function WorldMap() {
  const { data, isLoading } = useWorld();
  const { setView } = useBankOS();
  const regions = data?.regions ?? [];

  return (
    <div className="space-y-6">
      <ViewHeader badge="Explore" title="The Learning World" subtitle="Your syllabus, reimagined as a living map. Unlock regions as you master skills." />

      <GlassCard hover={false} className="relative overflow-hidden">
        <div className="relative h-[520px] p-6">
          <div className="absolute inset-0 dot-bg opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_70%)]" />
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="route" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path d="M 24% 18% Q 40% 10%, 58% 44% Q 70% 55%, 70% 30% M 58% 44% Q 45% 55%, 30% 62%" fill="none" stroke="url(#route)" strokeWidth="1.5" strokeDasharray="4 6" />
          </svg>

          {isLoading && (
            <div className="absolute inset-0 grid place-items-center text-white/40">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {regions.map((r, i) => {
            const pos = POSITIONS[r.id];
            const Icon = ICONS[r.icon] ?? Brain;
            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => r.unlocked && setView("skills")}
                disabled={!r.unlocked}
                style={{ top: pos.top, left: pos.left }}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className={cn("relative flex flex-col items-center gap-2 rounded-2xl border p-4 backdrop-blur-xl transition-all", r.unlocked ? "cursor-pointer border-white/10 bg-[#0b1120]/70 hover:border-white/20 hover:-translate-y-1" : "border-white/[0.06] bg-[#0b1120]/50 opacity-60")} style={{ boxShadow: r.unlocked ? `0 0 40px -10px ${r.color}55` : undefined }}>
                  <div className="absolute -inset-px -z-10 rounded-2xl opacity-40 blur-md" style={{ background: r.color }} />
                  <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: `${r.color}22`, color: r.color, border: `1px solid ${r.color}44` }}>
                    {r.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white">{r.name}</div>
                    {r.unlocked && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full" style={{ width: `${r.progress}%`, background: r.color }} />
                        </div>
                        <span className="text-[10px] text-white/50">{r.progress}%</span>
                      </div>
                    )}
                  </div>
                  {r.unlocked && (
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-[#0b1120] text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((r, i) => {
          const Icon = ICONS[r.icon] ?? Brain;
          return (
            <GlassCard key={r.id} delay={i * 0.05}>
              <div className="flex items-start gap-4 p-5">
                <Ring value={r.progress} size={56} stroke={6} gradientFrom={r.color} gradientTo={r.color} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: r.color }} />
                    <h3 className="text-sm font-semibold text-white">{r.name}</h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{r.desc}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
