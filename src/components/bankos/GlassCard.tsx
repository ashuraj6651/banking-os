"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlassCard — floating glass surface with optional glow border + reveal animation.
 */
type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  delay?: number;
  as?: "div" | "article" | "section";
};

export function GlassCard({
  children,
  className,
  glow = false,
  hover = true,
  delay = 0,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "glass-card rounded-3xl",
        glow && "glow-border",
        hover && "transition-all duration-500 hover:-translate-y-1",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/** A static glass panel (no reveal animation) for nested use. */
export function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-card rounded-3xl", className)}>{children}</div>
  );
}
