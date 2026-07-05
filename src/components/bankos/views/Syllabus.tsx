"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sigma,
  BookOpen,
  Cpu,
  Landmark,
  Newspaper,
  Building2,
  ListChecks,
  Check,
  ChevronDown,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { Ring } from "../Ring";
import { useSyllabus, useToggleSyllabus } from "@/lib/hooks";
import { SYLLABUS, TOTAL_TOPICS, SyllabusSubject } from "@/lib/syllabus";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Brain> = {
  Brain,
  Sigma,
  BookOpen,
  Cpu,
  Landmark,
  Newspaper,
  Building2,
};

export function Syllabus() {
  const { data, isLoading } = useSyllabus();
  const toggle = useToggleSyllabus();
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set([SYLLABUS[0].subject]));
  const [query, setQuery] = useState("");

  // build a quick-lookup map: `${subject}|${topic}` -> checked
  const checkedMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of data?.progress ?? []) {
      m.set(`${p.subject}|${p.topic}`, p.checked);
    }
    return m;
  }, [data]);

  const isChecked = (subject: string, topic: string) =>
    checkedMap.get(`${subject}|${topic}`) ?? false;

  function toggleTopic(subject: string, topic: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    toggle.mutate({ subject, topic });
  }

  function toggleSubjectOpen(subject: string) {
    setOpenSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  }

  function expandAll() {
    setOpenSubjects(new Set(SYLLABUS.map((s) => s.subject)));
  }
  function collapseAll() {
    setOpenSubjects(new Set());
  }

  // filtered syllabus based on search query
  const filteredSyllabus = useMemo(() => {
    if (!query.trim()) return SYLLABUS;
    const q = query.toLowerCase();
    return SYLLABUS.map((s) => {
      const groups = s.groups
        .map((g) => ({
          ...g,
          topics: g.topics.filter(
            (t) =>
              t.toLowerCase().includes(q) ||
              g.name.toLowerCase().includes(q) ||
              s.subject.toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.topics.length > 0);
      return { ...s, groups };
    }).filter((s) => s.groups.length > 0);
  }, [query]);

  // overall progress
  const totalChecked = Array.from(checkedMap.values()).filter(Boolean).length;
  const overallPct = Math.round((totalChecked / TOTAL_TOPICS) * 100);

  // when searching, auto-expand all subjects that have results
  const effectiveOpen = query.trim()
    ? new Set(filteredSyllabus.map((s) => s.subject))
    : openSubjects;

  return (
    <div className="space-y-6">
      <ViewHeader
        badge="Complete Syllabus"
        badgeIcon={<ListChecks className="h-3 w-3" />}
        title="Syllabus Checklist"
        subtitle="Every single topic across every section. Track what you've covered — nothing slips through."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10"
            >
              Expand all
            </button>
            <button
              onClick={collapseAll}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10"
            >
              Collapse all
            </button>
          </div>
        }
      />

      {/* overall progress bar */}
      <GlassCard hover={false} className="relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
          <Ring value={overallPct} size={120} stroke={11} label={`${overallPct}%`} sublabel="Covered" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Overall Coverage</h3>
            <p className="mt-1 text-sm text-white/50">
              {totalChecked} of {TOTAL_TOPICS} topics marked complete across {SYLLABUS.length} sections.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SYLLABUS.map((s) => {
                const subjectTotal = s.groups.reduce((a, g) => a + g.topics.length, 0);
                const subjectDone = s.groups
                  .flatMap((g) => g.topics)
                  .filter((t) => isChecked(s.subject, t)).length;
                const pct = subjectTotal > 0 ? Math.round((subjectDone / subjectTotal) * 100) : 0;
                return (
                  <div key={s.subject} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                      <span className="truncate text-[11px] font-medium text-white/70">{s.subject}</span>
                    </div>
                    <div className="mt-1.5 text-lg font-bold" style={{ color: s.color }}>{pct}%</div>
                    <div className="text-[10px] text-white/35">{subjectDone}/{subjectTotal}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* search */}
      <div className="sticky top-[60px] z-20">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1120]/90 px-4 py-2.5 backdrop-blur-2xl">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any topic, e.g. 'syllogism', 'DI', 'repo rate'…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="grid h-6 w-6 place-items-center rounded-md text-white/40 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading syllabus…
        </div>
      )}

      {/* subject sections */}
      <div className="space-y-4">
        {filteredSyllabus.map((s, si) => (
          <SubjectCard
            key={s.subject}
            subject={s}
            open={effectiveOpen.has(s.subject)}
            onToggle={() => toggleSubjectOpen(s.subject)}
            isChecked={isChecked}
            onToggleTopic={(topic) => toggleTopic(s.subject, topic)}
            delay={si * 0.04}
          />
        ))}
      </div>

      {filteredSyllabus.length === 0 && !isLoading && (
        <GlassCard hover={false}>
          <div className="p-10 text-center text-sm text-white/40">
            No topics match &ldquo;{query}&rdquo;.
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function SubjectCard({
  subject,
  open,
  onToggle,
  isChecked,
  onToggleTopic,
  delay,
}: {
  subject: SyllabusSubject;
  open: boolean;
  onToggle: () => void;
  isChecked: (subject: string, topic: string) => boolean;
  onToggleTopic: (topic: string) => void;
  delay: number;
}) {
  const Icon = ICONS[subject.icon] ?? Brain;
  const subjectTotal = subject.groups.reduce((a, g) => a + g.topics.length, 0);
  const subjectDone = subject.groups
    .flatMap((g) => g.topics)
    .filter((t) => isChecked(subject.subject, t)).length;
  const pct = subjectTotal > 0 ? Math.round((subjectDone / subjectTotal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard hover={false}>
        {/* header */}
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border"
            style={{ borderColor: `${subject.color}44`, background: `${subject.color}1a`, color: subject.color }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">{subject.subject}</h3>
              <span className="text-xs text-white/40">· {subjectTotal} topics</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: subject.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: subject.color }}>{pct}%</span>
              <span className="text-[11px] text-white/35">{subjectDone}/{subjectTotal}</span>
            </div>
          </div>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-white/50"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>

        {/* groups + topics */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/[0.06] p-4 pt-5">
                {subject.groups.map((g, gi) => {
                  const groupDone = g.topics.filter((t) => isChecked(subject.subject, t)).length;
                  return (
                    <div key={g.name} className={cn(gi > 0 && "mt-6")}>
                      <div className="mb-2 flex items-center justify-between px-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">{g.name}</h4>
                        <span className="text-[11px] text-white/30">{groupDone}/{g.topics.length}</span>
                      </div>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {g.topics.map((topic) => {
                          const checked = isChecked(subject.subject, topic);
                          return (
                            <button
                              key={topic}
                              onClick={(e) => onToggleTopic(topic)}
                              className={cn(
                                "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                                checked
                                  ? "border-emerald-400/30 bg-emerald-500/[0.06]"
                                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                              )}
                            >
                              <span
                                className={cn(
                                  "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all",
                                  checked
                                    ? "border-emerald-400/50 bg-emerald-500/20"
                                    : "border-white/15 bg-white/[0.03] group-hover:border-violet-400/40"
                                )}
                              >
                                {checked && <Check className="h-3.5 w-3.5 text-emerald-300" />}
                              </span>
                              <span className={cn("flex-1 leading-tight", checked ? "text-white/40 line-through" : "text-white/80")}>
                                {topic}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
