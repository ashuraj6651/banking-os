"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, ChevronRight, RefreshCw, BookOpen, Clock, Sparkles } from "lucide-react";
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
  const { data, isLoading, isError, refetch } = useCurrentAffairs();
  const { setView } = useBankOS();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const items = Array.isArray(data?.items) ? data.items : [];
  const showingSaved = data?.source === "database" || data?.stale === true;
  const emptyResponse = !isLoading && !isError && items.length === 0;

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/current-affairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || `Failed (${res.status})`);
      await refetch();
      toast.success(`Refreshed! ${result.count ?? result.items?.length ?? 0} items available.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch current affairs");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleTakeQuiz() {
    setView("practice");
    try {
      localStorage.setItem("bankos_practice_filter", JSON.stringify({ subject: "Current Affairs", difficulty: "All" }));
    } catch {
      // Ignore localStorage errors.
    }
    toast.success("Practice filtered to Current Affairs questions");
  }

  const tagCounts: Record<string, number> = {};
  items.forEach((item) => { tagCounts[item.tag] = (tagCounts[item.tag] || 0) + 1; });

  return (
    <div className="space-y-6">
      <ViewHeader
        badge="Daily"
        badgeIcon={<Newspaper className="h-3 w-3" />}
        title="Current Affairs"
        subtitle="Banking, RBI, economy and government schemes — updated regularly."
        actions={<button onClick={handleRefresh} disabled={isRefreshing} className="btn-press inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"><RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />{isRefreshing ? "Fetching…" : "Refresh"}</button>}
      />

      {isLoading && <div className="space-y-4"><div className="skeleton-shimmer h-40 rounded-3xl" /><div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-shimmer h-36 rounded-3xl" />)}</div></div>}

      {!isLoading && isError && <GlassCard hover={false}><div className="p-12 text-center"><Newspaper className="mx-auto h-10 w-10 text-rose-300" /><h3 className="mt-5 text-lg font-semibold text-white">Unable to load current affairs</h3><p className="mt-2 text-sm text-white/50">Current affairs could not be fetched right now. Please try again.</p><button onClick={handleRefresh} disabled={isRefreshing} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-5 py-2.5 text-sm font-semibold text-white"><RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />Retry</button></div></GlassCard>}

      {emptyResponse && <GlassCard hover={false}><div className="p-12 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10"><Newspaper className="h-7 w-7 text-violet-300" /></div><h3 className="mt-5 text-lg font-semibold text-white">No current affairs available</h3><p className="mt-1.5 text-sm text-white/50">The current affairs provider did not return any articles right now. Please try again later.</p><button onClick={handleRefresh} disabled={isRefreshing} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-5 py-2.5 text-sm font-semibold text-white"><RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />Refresh</button></div></GlassCard>}

      {!isLoading && !isError && items.length > 0 && <>
        {showingSaved && <div className="text-xs text-white/35">Showing saved current affairs</div>}
        <GlassCard hover={false}><div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm text-white/50"><BookOpen className="h-4 w-4 text-violet-300" /><span>{items.length} articles across {Object.keys(tagCounts).length} categories</span></div><div className="flex items-center gap-2">{Object.entries(tagCounts).map(([tag, count]) => <span key={tag} className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: `${TAG_COLOR[tag] || "#8b5cf6"}55`, background: `${TAG_COLOR[tag] || "#8b5cf6"}1a`, color: TAG_COLOR[tag] || "#8b5cf6" }}>{tag} ({count})</span>)}</div></div></GlassCard>
        <GlassCard hover={false} className="relative overflow-hidden"><div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex-1"><div className="flex items-center gap-3"><span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium text-violet-300"><Sparkles className="h-3 w-3" />Featured today</span><span className="flex items-center gap-1 text-[11px] text-white/35"><Clock className="h-3 w-3" />{items[0].timeLabel}</span></div><h3 className="mt-3 text-xl font-semibold text-white">{items[0].title}</h3><p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/50">{items[0].summary}</p></div><button onClick={handleTakeQuiz} className="btn-press inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-5 py-2.5 text-sm font-semibold text-white">Take quiz <ChevronRight className="h-4 w-4" /></button></div></GlassCard>
        <div className="grid gap-4 md:grid-cols-2">{items.slice(1).map((item, i) => { const tagColor = TAG_COLOR[item.tag] || "#8b5cf6"; const expanded = expandedId === item.id; return <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}><GlassCard><div role="button" tabIndex={0} className="w-full cursor-pointer p-5 text-left" onClick={() => setExpandedId(expanded ? null : item.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setExpandedId(expanded ? null : item.id); } }}><div className="flex items-center gap-2"><span className="rounded-lg border px-2.5 py-0.5 text-[11px] font-medium" style={{ borderColor: `${tagColor}55`, background: `${tagColor}1a`, color: tagColor }}>{item.tag}</span><span className="text-[11px] text-white/35">{item.timeLabel}</span></div><h4 className="mt-3 text-base font-semibold leading-snug text-white">{item.title}</h4><p className={cn("mt-1.5 text-sm leading-relaxed text-white/50 transition-all", expanded ? "max-h-40" : "max-h-12 overflow-hidden")}>{item.summary}</p><div className="mt-3 flex items-center justify-between"><span className="flex items-center gap-1 text-xs font-medium text-violet-300">{expanded ? "Show less" : "Read more"} <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} /></span><button onClick={(event) => { event.stopPropagation(); handleTakeQuiz(); }} className="btn-press rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/50">Quiz me</button></div></div></GlassCard></motion.div>; })}</div>
      </>}
    </div>
  );
}
