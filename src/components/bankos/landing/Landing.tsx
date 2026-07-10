"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useCallback } from "react";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Target,
  BarChart3,
  Network,
  Newspaper,
  RefreshCw,
  Check,
  Shield,
  Globe2,
} from "lucide-react";
import { useBankOS } from "@/lib/store";
import { Aurora } from "../Aurora";
import { MagneticButton, MagneticGhost } from "../MagneticButton";
import { GlassCard } from "../GlassCard";
import { Ring, MiniRing } from "../Ring";
import { Wordmark, SectionHeading, Reveal, Eyebrow } from "../Primitives";
import {
  STATS,
  FEATURES,
  TIMELINE,
  PRINCIPLES,
  FAQS,
  EXAMS,
} from "./landing-data";
import { cn } from "@/lib/utils";

export function Landing() {
  const { startAuth } = useBankOS();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  return (
    <div className="relative min-h-screen noise-bg">
      <Aurora />

      {/* ===== Nav ===== */}
      <header className="fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl border border-white/[0.06] bg-[#070b16]/70 px-4 py-3 backdrop-blur-2xl sm:px-6">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#journey" className="transition-colors hover:text-white">Journey</a>
            <a href="#stories" className="transition-colors hover:text-white">Stories</a>
          </nav>
          <div className="flex items-center gap-2">
            <MagneticGhost onClick={startAuth} className="hidden sm:inline-flex">
              Sign in
            </MagneticGhost>
            <MagneticButton onClick={startAuth} className="px-4 py-2 text-sm">
              Launch BankOS <ArrowRight className="h-4 w-4" />
            </MagneticButton>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section ref={heroRef} className="relative px-4 pt-36 sm:px-6 lg:pt-44">
        <div className="mx-auto max-w-6xl">
          <motion.div style={{ y, opacity }} className="flex flex-col items-center text-center">
            <Reveal>
              <Eyebrow>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                The Operating System for Banking Aspirants
              </Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Prepare like it&apos;s <span className="text-gradient">2030</span>.
                <br className="hidden sm:block" /> Get selected in 2027.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/55">
                BankOS isn&apos;t a coaching app. It&apos;s a study operating system — mission control,
                an adaptive AI planner, immersive focus mode, and a readiness engine that predicts
                your selection. Built for SBI PO, IBPS, RBI Grade B and every banking exam.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <MagneticButton onClick={startAuth} className="btn-press ripple-container px-7 py-3.5 text-base" onMouseDown={handleRipple}>
                  Enter Mission Control <ArrowRight className="h-4 w-4" />
                </MagneticButton>
                <MagneticGhost onClick={startAuth} className="btn-press px-6 py-3 text-base">
                  <Sparkles className="h-4 w-4 text-violet-300" /> Watch the AI Coach
                </MagneticGhost>
              </div>
            </Reveal>

            {/* exam chips */}
            <Reveal delay={0.2}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                {EXAMS.map((e) => (
                  <span key={e} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 backdrop-blur-md">
                    {e}
                  </span>
                ))}
              </div>
            </Reveal>
          </motion.div>

          {/* ===== Floating particle dots ===== */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {[
              { left: "10%", top: "25%", delay: "0s", duration: "7s", size: "3px", color: "rgba(139,92,246,0.5)" },
              { left: "25%", top: "60%", delay: "1.5s", duration: "8s", size: "2px", color: "rgba(34,211,238,0.4)" },
              { left: "45%", top: "15%", delay: "3s", duration: "6s", size: "2px", color: "rgba(139,92,246,0.3)" },
              { left: "65%", top: "45%", delay: "0.8s", duration: "9s", size: "3px", color: "rgba(34,211,238,0.5)" },
              { left: "80%", top: "20%", delay: "2s", duration: "7.5s", size: "2px", color: "rgba(139,92,246,0.4)" },
              { left: "90%", top: "65%", delay: "4s", duration: "6.5s", size: "2px", color: "rgba(34,211,238,0.3)" },
              { left: "15%", top: "80%", delay: "1s", duration: "8s", size: "2px", color: "rgba(139,92,246,0.35)" },
              { left: "55%", top: "75%", delay: "2.5s", duration: "7s", size: "3px", color: "rgba(34,211,238,0.45)" },
              { left: "35%", top: "35%", delay: "3.5s", duration: "9s", size: "2px", color: "rgba(167,139,250,0.4)" },
              { left: "75%", top: "80%", delay: "0.5s", duration: "8.5s", size: "2px", color: "rgba(139,92,246,0.3)" },
            ].map((p, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  animation: `particle-float ${p.duration} ease-in-out ${p.delay} infinite`,
                }}
              />
            ))}
          </div>

          {/* ===== Scroll-down indicator ===== */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator" aria-hidden="true">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Scroll</span>
              <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="text-white/30">
                <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="2" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* ===== Floating dashboard preview ===== */}
          <Reveal delay={0.25} y={40}>
            <div className="mb-3 text-center text-[11px] uppercase tracking-[0.22em] text-white/30">
              Product preview · your real data fills in after onboarding
            </div>
            <HeroPreview />
          </Reveal>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05}>
              <GlassCard hover={false} className="text-center">
                <div className="p-6">
                  <div className="text-4xl font-bold text-gradient-static">{s.value}</div>
                  <div className="mt-1.5 text-xs uppercase tracking-[0.16em] text-white/40">{s.label}</div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="The System"
            title={<>Everything an aspirant needs.<br />Nothing they don&apos;t.</>}
            subtitle="Twelve modules, one cohesive operating system. Each replaces a messy spreadsheet, a scattered notebook, or a coaching subscription."
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = ICON_MAP[f.icon] ?? Sparkles;
              return (
                <Reveal key={f.title} delay={(i % 3) * 0.08}>
                  <GlassCard className="btn-press h-full">
                    <div className="p-6">
                      <div
                        className="grid h-11 w-11 place-items-center rounded-2xl border"
                        style={{ borderColor: `${f.color}44`, background: `${f.color}1a`, color: f.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/50">{f.desc}</p>
                    </div>
                  </GlassCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Coach preview band ===== */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <GlassCard hover={false} className="relative overflow-hidden">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="relative grid items-center gap-8 p-8 lg:grid-cols-2 lg:p-12">
                <div>
                  <Eyebrow><Sparkles className="h-3 w-3" /> AI Coach</Eyebrow>
                  <h3 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    A mentor that never sleeps.
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-white/55">
                    Morning briefings. Night reviews. Performance analysis. Personalised strategy.
                    Your AI Coach turns raw data into your next best move — every single day.
                  </p>
                  <div className="mt-6 space-y-2.5">
                    {["Adaptive daily roadmap", "Weakness detection & recovery plans", "Motivation calibrated to your state"].map((t) => (
                      <div key={t} className="flex items-center gap-2.5 text-sm text-white/70">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-violet-500/20">
                          <Check className="h-3 w-3 text-violet-300" />
                        </span>
                        {t}
                      </div>
                    ))}
                  </div>
                  <MagneticButton onClick={startAuth} className="btn-press ripple-container mt-7" onMouseDown={handleRipple}>
                    Meet your Coach <ArrowRight className="h-4 w-4" />
                  </MagneticButton>
                </div>
                <CoachPreview />
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* ===== Journey timeline ===== */}
      <section id="journey" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="The Journey"
            title="From Day 1 to selection."
            subtitle="A 321-day adaptive roadmap that reshapes itself based on your performance."
          />
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" />
            <div className="grid gap-6 lg:grid-cols-4">
              {TIMELINE.map((t, i) => (
                <Reveal key={t.phase} delay={i * 0.08}>
                  <div className="relative">
                    <div className="mb-5 hidden h-3 w-3 place-items-center lg:flex">
                      <span className="h-3 w-3 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 ring-4 ring-[#050816]" />
                    </div>
                    <GlassCard className="h-full">
                      <div className="p-6">
                        <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">{t.days}</div>
                        <h3 className="mt-2 text-lg font-semibold text-white">{t.phase}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-white/50">{t.desc}</p>
                      </div>
                    </GlassCard>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Principles ===== */}
      <section id="stories" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Principles"
            title="Built different, on purpose."
            subtitle="BankOS treats preparation like a system, not a gamble. Three ideas guide everything."
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <GlassCard className="h-full">
                  <div className="p-7">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/10 text-violet-300">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{p.desc}</p>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ===== FAQ ===== */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Questions, answered." />
          <div className="mt-12 space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.04}>
                <GlassCard hover={false}>
                  <details className="group p-6">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="text-base font-medium text-white">{f.q}</span>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-white/55">{f.a}</p>
                  </details>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <GlassCard hover={false} className="relative overflow-hidden">
              <div className="aurora opacity-40" />
              <div className="relative flex flex-col items-center gap-6 p-12 text-center">
                <Eyebrow><Sparkles className="h-3 w-3" /> The Apple of Banking Preparation</Eyebrow>
                <h2 className="max-w-2xl text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Your selection is a system. Run it on BankOS.
                </h2>
                <p className="max-w-xl text-base text-white/55">
                  Join 48,000+ aspirants who replaced scattered prep with one operating system.
                </p>
                <MagneticButton onClick={startAuth} className="btn-press ripple-container mt-2 px-8 py-4 text-base" onMouseDown={handleRipple}>
                  Launch BankOS <ArrowRight className="h-4 w-4" />
                </MagneticButton>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/[0.06] px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Wordmark />
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
          Made with <span className="text-red-500">❤️</span> by{" "}
          <span className="font-semibold text-white">Ashu</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Hero floating preview (matches the user's mockup) ---------- */
function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto mt-16 max-w-4xl"
    >
      {/* glow under */}
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-r from-violet-500/20 via-electric-500/10 to-cyan-500/20 blur-2xl" />
      <div className="float-slow overflow-hidden rounded-3xl border border-white/10 bg-[#0b1120]/80 shadow-2xl backdrop-blur-2xl">
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-400/70" />
          <span className="h-3 w-3 rounded-full bg-amber-400/70" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
          <span className="ml-3 text-xs text-white/30">bankos.app / mission-control</span>
        </div>

        <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
          {/* greeting + mission */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Mission Control
            </div>
            <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Good Evening, <span className="text-gradient-static">Ashu</span>
            </h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
              <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-200">SBI PO 2027</span>
              <span>· 321 days remaining</span>
            </div>

            <div className="mt-5 space-y-2">
              {[
                { t: "Reading Comprehension", done: true },
                { t: "Puzzle Practice", done: false },
                { t: "Quant Drill", done: false },
                { t: "Current Affairs", done: false },
                { t: "Mock Test", done: false },
              ].map((m) => (
                <div key={m.t} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <span className={cn("grid h-5 w-5 place-items-center rounded-md border", m.done ? "border-emerald-400/40 bg-emerald-500/20" : "border-white/15")}>
                    {m.done && <Check className="h-3 w-3 text-emerald-300" />}
                  </span>
                  <span className={cn("text-sm", m.done ? "text-white/40 line-through" : "text-white/80")}>{m.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* readiness + CTA */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <Ring value={82} size={130} stroke={11} label="82%" sublabel="Readiness" />
              <div className="mt-3 grid w-full grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-white/[0.03] py-2">
                  <div className="text-sm font-bold text-emerald-300">74%</div>
                  <div className="text-[10px] text-white/40">Selection</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] py-2">
                  <div className="text-sm font-bold text-amber-300">47</div>
                  <div className="text-[10px] text-white/40">Streak</div>
                </div>
              </div>
            </div>
            <button className="shine inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 py-3 text-sm font-semibold text-white">
              <Zap className="h-4 w-4" /> Start Focus Session
            </button>
            <div className="grid grid-cols-3 gap-2">
              {[{ l: "Reasoning", v: 88, c: "#8b5cf6" }, { l: "Quant", v: 71, c: "#3b82f6" }, { l: "English", v: 79, c: "#22d3ee" }].map((s) => (
                <div key={s.l} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <MiniRing value={s.v} size={42} stroke={4} color={s.c} />
                  <span className="text-[10px] text-white/40">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Coach preview card ---------- */
function CoachPreview() {
  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-black/30 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-electric-500">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white">Mentor</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> online
        </span>
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] p-3.5 text-sm leading-relaxed text-white/85">
        Good evening, Ashu. Reasoning is up <span className="text-emerald-300">+4%</span> this week. Quant dipped — I&apos;ve queued two DI drills for tomorrow. Want a focused 3-day Quant recovery plan?
      </div>
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-b from-violet-500 to-electric-600 px-3.5 py-2.5 text-sm text-white">
          Yes, build the plan 🚀
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
        {[0, 1, 2].map((d) => (
          <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-violet-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: d * 0.15, repeat: Infinity }} />
        ))}
        <span className="ml-2 text-xs text-white/40">Mentor is drafting your plan…</span>
      </div>
    </div>
  );
}

/* ---------- icon map ---------- */
const ICON_MAP: Record<string, typeof Sparkles> = {
  Sparkles, Zap, Brain, Target, BarChart3, Network, Newspaper, RefreshCw, Shield, Globe2,
};
