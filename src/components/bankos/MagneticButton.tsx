"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * MagneticButton — cursor-following magnetic hover with a liquid shine.
 */
type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
  as?: "button" | "div";
};

export function MagneticButton({
  children,
  className,
  onClick,
  strength = 18,
}: MagneticButtonProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 });

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mx.set((x / rect.width) * strength);
    my.set((y / rect.height) * strength);
  }
  function reset() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.button
      ref={ref as never}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onClick={onClick}
      style={{ x: sx, y: sy }}
      className={cn(
        "shine relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold tracking-tight transition-shadow duration-300 cursor-pointer select-none",
        "bg-gradient-to-b from-violet-500 to-electric-600 text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] hover:shadow-[0_10px_40px_-6px_rgba(139,92,246,0.85)]",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

/** Ghost variant magnetic button */
export function MagneticGhost({
  children,
  className,
  onClick,
}: MagneticButtonProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 220, damping: 18 });
  const sy = useSpring(my, { stiffness: 220, damping: 18 });

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mx.set((x / rect.width) * 10);
    my.set((y / rect.height) * 10);
  }
  return (
    <motion.button
      ref={ref as never}
      onMouseMove={handleMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      onClick={onClick}
      style={{ x: sx, y: sy }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/10",
        className
      )}
    >
      {children}
    </motion.button>
  );
}
