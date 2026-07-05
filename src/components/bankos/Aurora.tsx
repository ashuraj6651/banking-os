"use client";

import { cn } from "@/lib/utils";

/**
 * Aurora — animated, premium ambient background.
 * Layered radial gradients drifting on a deep space canvas.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <div className="aurora" />
      <div className="aurora-cyan" />
      {/* subtle grid */}
      <div className="absolute inset-0 grid-bg opacity-60" />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,8,22,0.9)_100%)]" />
    </div>
  );
}

/** Static aurora used inside cards/sections (not fixed). */
export function AuroraInline({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="aurora opacity-50" />
    </div>
  );
}
