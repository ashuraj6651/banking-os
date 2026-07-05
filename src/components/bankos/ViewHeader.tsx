"use client";

import { motion } from "framer-motion";
import { GlowBadge } from "./Primitives";
import { cn } from "@/lib/utils";

export function ViewHeader({
  title,
  subtitle,
  badge,
  badgeIcon,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div>
        {badge && (
          <div className="mb-3">
            <GlowBadge color="violet">
              {badgeIcon}
              {badge}
            </GlowBadge>
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-white/50">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
