"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ChevronRight, Loader2, RefreshCw, BookOpen, Clock, TrendingUp, Sparkles } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { useCurrentAffairs } from "@/lib/hooks";
import { useBankOS } from "@/lib/store";
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
  const { setView } = useBankOS();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  function handleTakeQuiz() {
    // Navigate to Practice with Current Affairs filter pre-selected
    setView("practice");
    // Store the filter preference so Practice can read it
    try {
      localStorage.setItem("bankos_practice_filter", JSON.stringify({ subject: "Current Affairs", difficulty: "All" }));
    } catch {
      // Ignore localStorage errors
    }
    toast.success("Practice filtered to Current Affairs questions");
  }

  // Tag distribution stats
  const tagCounts: Record<string, number> = {};
  items.forEach((c) => { tagCounts[c.tag] = (tagCounts[c.tag] || 0) + 1; });

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
            className="btn-press inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Fetching…" : "Refresh"}
          </button>
        }
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="skeleton-shimmer h-40 rounded-3xl" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer h-36 rounded-3xl" />
            ))}
          </div>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <>
          {/* Tag distribution bar */}
          <GlassCard hover={false}>
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <BookOpen className="h-4 w-4 text-violet-300" />
                <span>{items.length} articles across {Object.keys(tagCounts).length} categories</span>
              </div>
              <div className="flex items-center gap-2">
                {Object.entries(tagCounts).map(([tag, count]) => (
                  <span
                    key={tag}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      borderColor: `${TAG_COLOR[tag] || "#8b5cf6"}55`,
                      background: `${TAG_COLOR[tag] || "#8b5cf6"}1a`,
                      color: TAG_COLOR[tag] || "#8b5cf6",
                    }}
                  >
                    {tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Featured card */}
          <GlassCard hover={false} className="relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-electric-500/10 blur-3xl" />
            <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      borderColor: `${TAG_COLOR[items[0].tag] || "#8b5cf6"}55`,
                      background: `${TAG_COLOR[items[0].tag] || "#8b5cf6"}1a`,
                      color: TAG_COLOR[items[0].tag] || "#8b5cf6",
                    }}
                  >
                    <Sparkles className="h-3 w-3" />
                    Featured today
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/35">
                    <Clock className="h-3 w-3" /> {items[0].timeLabel}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">{items[0].title}</h3>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/50">{items[0].summary}</p>
              </div>
              <button
                onClick={handleTakeQuiz}
                className="btn-press inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.6)] transition-shadow hover:shadow-[0_8px_28px_-4px_rgba(139,92,246,0.8)]"
              >
                Take quiz <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>

          {/* Articles grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {items.slice(1).map((c, i) => {
              const tagColor = TAG_COLOR[c.tag] || "#8b5cf6";
              const isExpanded = expandedId === c.id;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard>
                    <button
                      className="w-full p-5 text-left"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-lg border px-2.5 py-0.5 text-[11px] font-medium"
                          style={{
                            borderColor: `${tagColor}55`,
                            background: `${tagColor}1a`,
                            color: tagColor,
                          }}
                        >
                          {c.tag}
                        </span>
                        <span className="text-[11px] text-white/35">{c.timeLabel}</span>
                      </div>
                      <h4 className="mt-3 text-base font-semibold leading-snug text-white">{c.title}</h4>
                      <p className={cn(
                        "mt-1.5 text-sm leading-relaxed text-white/50 transition-all",
                        isExpanded ? "max-h-40" : "max-h-12 overflow-hidden"
                      )}>
                        {c.summary}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-medium text-violet-300">
                          {isExpanded ? "Show less" : "Read more"} <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-90")} />
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTakeQuiz();
                          }}
                          className="btn-press rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/50 transition-colors hover:border-violet-400/40 hover:text-violet-200"
                        >
                          Quiz me
                        </button>
                      </div>
                    </button>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {!isLoading && items.length === 0 && (
        <GlassCard hover={false}>
          <div className="p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10">
              <Newspaper className="h-7 w-7 text-violet-300" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">No current affairs yet</h3>
            <p className="mt-1.5 text-sm text-white/50">Click Refresh to fetch the latest banking, RBI and economy news.</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-press mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.6)]"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Fetch Now
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}