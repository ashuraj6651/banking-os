"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Ring — circular progress with animated stroke + glow.
 */
export function Ring({
  value,
  size = 160,
  stroke = 12,
  label,
  sublabel,
  className,
  gradientFrom = "#8b5cf6",
  gradientTo = "#22d3ee",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const gid = `ring-${gradientFrom}-${gradientTo}`.replace(/[^a-z0-9]/gi, "");

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${gradientFrom}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && (
          <span className="text-3xl font-bold tracking-tight text-white">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-white/40">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

/** Small inline stat ring */
export function MiniRing({
  value,
  size = 56,
  stroke = 6,
  color = "#8b5cf6",
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute text-[11px] font-semibold text-white">{value}</span>
    </div>
  );
}
