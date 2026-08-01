"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sigma, BookOpen, Newspaper, Building2, Lock, ArrowRight, X, Play, ArrowUpRight } from "lucide-react";
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

const ROUTES = [
  { from: "reasoning-city", to: "quant-valley", cp1: "40% 10%", cp2: null },
  { from: "quant-valley", to: "current-district", cp1: "70% 55%", cp2: null },
  { from: "quant-valley", to: "english-kingdom", cp1: "45% 55%", cp2: null },
];

export function WorldMap() {
  const { data, isLoading } = useWorld();
  const { setView } = useBankOS();
  const [selectedRegion, setSelectedRegion] = useState<(typeof data extends { regions: (infer R)[] } | undefined ? R : never) | null>(null);

  const regions = data?.regions ?? [];
  const avgProgress = regions.length > 0 ? Math.round(regions.reduce((s, r) => s + r.progress, 0) / regions.length) : 0;

  return (
    <div className="space-y-6">
      <ViewHeader badge="Explore" title="The Learning World" subtitle="Your syllabus, reimagined as a living map. Unlock regions as you master skills." />

      <GlassCard hover={false} className="relative overflow-hidden">
        <div className="relative h-[520px] p-6">
          <div className="absolute inset-0 dot-bg opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_70%)]" />

          {/* Animated SVG Route Lines */}
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="route" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.25" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {ROUTES.map((route, i) => {
              const from = POSITIONS[route.from];
              const to = POSITIONS[route.to];
              const cp = route.cp1;
              const d = cp
                ? `M ${from.left} ${from.top} Q ${cp}, ${to.left} ${to.top}`
                : `M ${from.left} ${from.top} L ${to.left} ${to.top}`;
              return (
                <g key={i}>
                  <path
                    d={d}
                    fill="none"
                    stroke="url(#route)"
                    strokeWidth="1.5"
                    strokeDasharray="6 8"
                    filter="url(#glow)"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-28"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              );
            })}

            {/* Pulsing glow at each region node position */}
            {regions.map((r) => {
              const pos = POSITIONS[r.id];
              if (!pos || !r.unlocked) return null;
              return (
                <circle
                  key={r.id}
                  cx={pos.left}
                  cy={pos.top}
                  r="6"
                  fill="none"
                  stroke={r.color}
                  strokeWidth="1"
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    values="6;18;6"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0;0.4"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
              );
            })}
          </svg>

          {/* Loading Skeleton State */}
          {isLoading && (
            <div className="absolute inset-0 p-6">
              {Object.entries(POSITIONS).map(([id, pos]) => (
                <div
                  key={id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ top: pos.top, left: pos.left }}
                >
                  <div className="skeleton-shimmer flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#0b1120]/50 p-4">
                    <div className="h-12 w-12 rounded-xl bg-white/[0.06]" />
                    <div className="h-3 w-16 rounded bg-white/[0.06]" />
                    <div className="h-1 w-12 rounded-full bg-white/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Region Nodes */}
          {!isLoading &&
            regions.map((r, i) => {
              const pos = POSITIONS[r.id];
              const Icon = ICONS[r.icon] ?? Brain;
              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => r.unlocked && setSelectedRegion(r)}
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

          {/* Region Detail Panel */}
          <AnimatePresence>
            {selectedRegion && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-6 left-6 right-6 z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120]/90 p-5 backdrop-blur-xl sm:left-auto sm:right-6 sm:top-6 sm:bottom-auto sm:w-80"
              >
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-4">
                  <Ring
                    value={selectedRegion.progress}
                    size={64}
                    stroke={5}
                    gradientFrom={selectedRegion.color}
                    gradientTo={selectedRegion.color}
                    label={`${selectedRegion.progress}`}
                  />
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = ICONS[selectedRegion.icon] ?? Brain;
                        return <Icon className="h-4 w-4" style={{ color: selectedRegion.color }} />;
                      })()}
                      <h3 className="text-sm font-semibold text-white">{selectedRegion.name}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">{selectedRegion.desc}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-white/40">Overall Progress</span>
                    <span className="font-medium tabular-nums" style={{ color: selectedRegion.color }}>{selectedRegion.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${selectedRegion.color}, ${selectedRegion.color}cc)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedRegion.progress}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-white/30">
                    {Math.round(selectedRegion.progress / 20)} topics mastered
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => { setSelectedRegion(null); setView("skills"); }}
                    className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white transition-all"
                    style={{ background: `linear-gradient(135deg, ${selectedRegion.color}33, ${selectedRegion.color}1a)`, border: `1px solid ${selectedRegion.color}44` }}
                  >
                    Continue
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => { setSelectedRegion(null); setView("practice"); }}
                    className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/10"
                  >
                    <Play className="h-3 w-3" />
                    Start Practice
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Overall Progress Bar */}
        {!isLoading && regions.length > 0 && (
          <div className="absolute right-6 bottom-0 left-6 flex items-center gap-3 border-t border-white/[0.06] bg-[#070b16]/80 px-5 py-3 backdrop-blur-sm">
            <span className="text-xs text-white/40">Map Progress</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #8b5cf6, #22d3ee)" }}
                initial={{ width: 0 }}
                whileInView={{ width: `${avgProgress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-violet-300">{avgProgress}%</span>
          </div>
        )}
      </GlassCard>

      {/* Region Cards Grid */}
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
                  {r.unlocked && (
                    <button
                      onClick={() => setView("skills")}
                      className="btn-press mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-300 transition-colors hover:text-violet-200"
                    >
                      Explore <ArrowUpRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}