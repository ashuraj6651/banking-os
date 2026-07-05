"use client";
import Image from "next/image";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Reveal — fade + rise on scroll into view */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Eyebrow pill */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/60 backdrop-blur-md",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Section heading block */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <Reveal>
          <Eyebrow>
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {eyebrow}
          </Eyebrow>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="max-w-3xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-white/50 sm:text-lg">
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/** BankOS wordmark / logo lockup */
export function Wordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-electric-500 to-cyan-400 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.7)]",
          dim
        )}
      >
        <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_60%)]" />

        <Image
          src="/logo.png"
          alt="BankOS"
          width={36}
          height={36}
          priority
          className="relative h-[78%] w-[78%] object-contain"
        />
      </div>
      
      <span className={cn("font-semibold tracking-tight text-white", text)}>
        Bank<span className="text-violet-400">OS</span>
      </span>
    </div>
  );
}

/** Premium tag/badge */
export function GlowBadge({
  children,
  color = "violet",
  className,
}: {
  children: React.ReactNode;
  color?: "violet" | "electric" | "cyan" | "amber" | "emerald";
  className?: string;
}) {
  const colors: Record<string, string> = {
    violet: "border-violet-400/30 bg-violet-500/10 text-violet-200",
    electric: "border-electric-400/30 bg-electric-500/10 text-electric-200",
    cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
