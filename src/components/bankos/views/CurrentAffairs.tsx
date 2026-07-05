"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { useCurrentAffairs } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TAG_COLOR: Record<string, string> = {
  RBI: "#8b5cf6",
  Economy: "#22d3ee",
  Banking: "#3b82f6",
  Schemes: "#10b981",
};

export function CurrentAffairs() {
  const { data, isLoading, refetch } = useCurrentAffairs();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const items = data?.items ?? [];

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/current-affairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      const result = await res.json();
      toast.success(`Refreshed! ${result.newCount ?? 0} new items added.`);
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to refresh";
      toast.error(msg);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        badge="Daily"
        badgeIcon={<Newspaper className="h-3 w-3" />}
        title="Current Affairs"
        subtitle="Banking, RBI, economy and government schemes — updated regularly."
        actions={
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Fetching…" : "Refresh"}
          </button>
        }
      />

      {items.length > 0 && (
        <GlassCard hover={false} className="relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: `${TAG_COLOR[items[0].tag] || "#8b5cf6"}55`, background: `${TAG_COLOR[items[0].tag] || "#8b5cf6"}1a`, color: TAG_COLOR[items[0].tag] || "#8b5cf6" }}>
                Featured today
              </span>
              <h3 className="mt-3 text-xl font-semibold text-white">{items[0].title}</h3>
              <p className="mt-1.5 max-w-xl text-sm text-white/50">{items[0].summary}</p>
            </div>
            <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-5 py-2.5 text-sm font-semibold text-white">
              Take quiz <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </GlassCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {items.slice(1).map((c, i) => {
          const tagColor = TAG_COLOR[c.tag] || "#8b5cf6";
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard>
                <button className="w-full p-5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border px-2.5 py-0.5 text-[11px] font-medium" style={{ borderColor: `${tagColor}55`, background: `${tagColor}1a`, color: tagColor }}>
                      {c.tag}
                    </span>
                    <span className="text-[11px] text-white/35">{c.timeLabel}</span>
                  </div>
                  <h4 className="mt-3 text-base font-semibold leading-snug text-white">{c.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/50">{c.summary}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-300">
                    Read & revise <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {items.length === 0 && !isLoading && (
        <div className="py-16 text-center">
          <Newspaper className="mx-auto mb-3 h-8 w-8 text-white/20" />
          <p className="text-sm text-white/40">No current affairs yet. Click Refresh to fetch the latest.</p>
        </div>
      )}
    </div>
  );
}