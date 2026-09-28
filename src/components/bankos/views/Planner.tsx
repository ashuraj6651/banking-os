"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Loader2,
  StickyNote,
  ListTodo,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard, GlassPanel } from "../GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PLANNER_SUBJECTS, PLANNER_PRIORITIES } from "@/lib/data";
import {
  usePlannerDay,
  useCreatePlannerTask,
  useTogglePlannerTask,
  useDeletePlannerTask,
  useSavePlannerNote,
  PlannerTask,
} from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRIORITY_STYLES: Record<string, string> = {
  low: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  medium: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  high: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

function fmtDateLabel(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function Planner() {
  const [date, setDate] = useState(() => new Date());
  const [calOpen, setCalOpen] = useState(false);

  const { data, isLoading } = usePlannerDay(date);
  const createTask = useCreatePlannerTask(date);
  const toggleTask = useTogglePlannerTask(date);
  const deleteTask = useDeletePlannerTask(date);
  const saveNote = useSavePlannerNote(date);

  const tasks = data?.tasks ?? [];

  // --- add-task form state ---
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [priority, setPriority] = useState("medium");
  const [estMinutes, setEstMinutes] = useState(30);
  const [description, setDescription] = useState("");

  // --- quick notes ---
  const [note, setNote] = useState("");
  const [noteDirty, setNoteDirty] = useState(false);
  useEffect(() => {
    setNote(data?.note ?? "");
    setNoteDirty(false);
  }, [data?.note, date]);

  // autosave note 900ms after the user stops typing
  useEffect(() => {
    if (!noteDirty) return;
    const t = setTimeout(() => {
      saveNote.mutate(note, { onSuccess: () => setNoteDirty(false) });
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, noteDirty]);

  const summary = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "done");
    const totalMinutes = tasks.reduce((s, t) => s + (t.estMinutes || 0), 0);
    const doneMinutes = completed.reduce((s, t) => s + (t.estMinutes || 0), 0);
    return {
      total: tasks.length,
      completed: completed.length,
      pending: tasks.length - completed.length,
      totalMinutes,
      doneMinutes,
      pct: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  async function handleAddTask() {
    if (!title.trim()) {
      toast.error("Give the task a title first");
      return;
    }
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        subject,
        priority,
        estMinutes,
        description: description.trim(),
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setEstMinutes(30);
      toast.success("Task added");
    } catch {
      toast.error("Could not add task");
    }
  }

  async function handleToggle(task: PlannerTask) {
    try {
      await toggleTask.mutateAsync(task.id);
    } catch {
      toast.error("Could not update task");
    }
  }

  async function handleDelete(task: PlannerTask) {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Task removed");
    } catch {
      toast.error("Could not remove task");
    }
  }

  function shiftDay(delta: number) {
    setDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }

  const isToday = isSameDay(date, new Date());

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Daily Planner"
        subtitle="Create tasks, pick a date on the calendar, and track your study plan for each day."
        badge="Planner"
        badgeIcon={<CalendarDays className="h-3 w-3" />}
        actions={
          <div className="flex items-center gap-2">
            {saveNote.isPending || noteDirty ? (
              <span className="flex items-center gap-1.5 text-xs text-white/40">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving
              </span>
            ) : (
              <span className="text-xs text-white/30">Saved</span>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===== Main column ===== */}
        <div className="space-y-6 lg:col-span-2">
          {/* Date selector */}
          <GlassCard className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-white/60 hover:bg-white/5 hover:text-white"
                  onClick={() => shiftDay(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex min-w-[220px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
                      <CalendarDays className="h-4 w-4 text-violet-300" />
                      {fmtDateLabel(date)}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (d) setDate(d);
                        setCalOpen(false);
                      }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-white/60 hover:bg-white/5 hover:text-white"
                  onClick={() => shiftDay(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => setDate(new Date())}
                >
                  Jump to today
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Add task form */}
          <GlassCard className="p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4 text-violet-300" /> Add a task
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-white/40">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANNER_SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANNER_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">
                  Est. minutes
                </label>
                <Input
                  type="number"
                  min={5}
                  max={600}
                  value={estMinutes}
                  onChange={(e) => setEstMinutes(Number(e.target.value) || 0)}
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-white/40">
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What should this task accomplish?"
                  className="min-h-[70px] border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleAddTask}
                disabled={createTask.isPending}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-electric-500 text-white hover:opacity-90"
              >
                {createTask.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 h-4 w-4" />
                )}
                Add task
              </Button>
            </div>
          </GlassCard>

          {/* Checklist */}
          <GlassCard className="p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <ListTodo className="h-4 w-4 text-violet-300" /> Checklist for {fmtDateLabel(date)}
            </h3>

            {isLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 py-10 text-center">
                <ListTodo className="h-8 w-8 text-white/20" />
                <p className="text-sm text-white/40">No tasks yet for this day.</p>
                <p className="text-xs text-white/25">Add one above to build your plan.</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {tasks.map((task) => {
                    const done = task.status === "done";
                    return (
                      <motion.li
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors",
                          done && "bg-white/[0.01] opacity-60"
                        )}
                      >
                        <button
                          onClick={() => handleToggle(task)}
                          className="mt-0.5 shrink-0 text-violet-300 transition-transform hover:scale-110"
                        >
                          {done ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5 text-white/25" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-medium text-white",
                              done && "text-white/40 line-through"
                            )}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-white/40">
                              {task.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                              {task.subject}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                                PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium
                              )}
                            >
                              {task.priority}
                            </span>
                            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                              <Clock className="h-2.5 w-2.5" /> {task.estMinutes}m
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(task)}
                          className="shrink-0 rounded-lg p-1.5 text-white/25 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                          title="Remove task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </GlassCard>
        </div>

        {/* ===== Sidebar ===== */}
        <div className="space-y-6">
          {/* Quick notes */}
          <GlassCard className="p-5 sm:p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <StickyNote className="h-4 w-4 text-amber-300" /> Quick notes
            </h3>
            <Textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteDirty(true);
              }}
              placeholder="Capture study goals, reminders, or anything you want to remember."
              className="min-h-[110px] border-white/10 bg-white/5 text-white placeholder:text-white/30"
            />
          </GlassCard>

          {/* Summary */}
          <GlassPanel className="p-5 sm:p-6">
            <h3 className="mb-1 text-base font-semibold text-white">Planner summary</h3>
            <p className="mb-4 text-xs text-white/40">
              Save, track, and review the tasks you want to complete for this day.
            </p>

            <div className="space-y-2.5">
              <SummaryRow label="Tasks" value={summary.total} />
              <SummaryRow label="Completed" value={summary.completed} accent="emerald" />
              <SummaryRow label="Pending" value={summary.pending} accent="amber" />
              <SummaryRow label="Total minutes" value={summary.totalMinutes} />
              <SummaryRow label="Minutes completed" value={summary.doneMinutes} accent="emerald" />
            </div>

            {summary.total > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/40">
                  <span>Progress</span>
                  <span>{summary.pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-electric-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${summary.pct}%` }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5">
      <span className="text-sm text-white/50">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold text-white",
          accent === "emerald" && "text-emerald-300",
          accent === "amber" && "text-amber-300"
        )}
      >
        {value}
      </span>
    </div>
  );
}
