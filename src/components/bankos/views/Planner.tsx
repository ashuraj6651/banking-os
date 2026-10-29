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
  Copy,
  Calendar as CalendarIcon,
  Play,
  Pause,
  Square,
  Timer as TimerIcon,
  Check,
  ArrowRight,
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
import { usePlannerTimer } from "@/hooks/use-planner-timer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type TaskWithStudy = PlannerTask & { studiedSeconds?: number | null };

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

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function fromDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function fmtClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function fmtStudied(ms: number) {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return ms >= 1000 ? "<1m" : "0m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

async function jfetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function Planner() {
  const qc = useQueryClient();
  const [date, setDate] = useState(() => new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState<Date | undefined>(undefined);
  const [isCopying, setIsCopying] = useState(false);

  const { data, isLoading } = usePlannerDay(date);
  const createTask = useCreatePlannerTask(date);
  const toggleTask = useTogglePlannerTask(date);
  const deleteTask = useDeletePlannerTask(date);
  const saveNote = useSavePlannerNote(date);

  // Study timer (server-synced: studied time DB mein save hota hai)
  const timer = usePlannerTimer();
  const { state: timerState, elapsedMs } = timer;
  const timerActive = !!timerState.activeTaskId;
  const timerOnThisDate = timerActive && timerState.dateKey === toDateKey(date);

  const tasks = (data?.tasks ?? []) as TaskWithStudy[];

  /* ---------------- add-task form ---------------- */
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [priority, setPriority] = useState("medium");
  const [estMinutes, setEstMinutes] = useState(30);
  const [description, setDescription] = useState("");

  /* ---------------- quick note (auto-save) ---------------- */
  const [note, setNote] = useState("");
  const [noteDirty, setNoteDirty] = useState(false);
  useEffect(() => {
    setNote(data?.note ?? "");
    setNoteDirty(false);
  }, [data?.note, date]);

  useEffect(() => {
    if (!noteDirty) return;
    const t = setTimeout(() => {
      saveNote.mutate(note, { onSuccess: () => setNoteDirty(false) });
    }, 900);
    return () => clearTimeout(t);
  }, [note, noteDirty]);

  /* ---------------- summary ---------------- */
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

  const studiedTodayMs = useMemo(() => {
    let total = 0;
    for (const t of tasks) {
      total += (t.studiedSeconds ?? 0) * 1000;
      if (timerOnThisDate && timerState.activeTaskId === t.id) total += elapsedMs;
    }
    return total;
  }, [tasks, timerOnThisDate, timerState.activeTaskId, elapsedMs]);

  /* ---------------- task actions ---------------- */
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

  async function handleToggle(task: TaskWithStudy) {
    const willBeDone = task.status !== "done";
    // Is task ka timer chal raha hai aur user manually complete kar raha hai:
    // time + done status ek saath save karo (double request / lost time nahi).
    if (willBeDone && timerState.activeTaskId === task.id) {
      await timer.stopTimer(true);
      return;
    }
    try {
      await toggleTask.mutateAsync(task.id);
    } catch {
      toast.error("Could not update task");
    }
  }

  async function handleDelete(task: TaskWithStudy) {
    try {
      await deleteTask.mutateAsync(task.id);
      if (timerState.activeTaskId === task.id) timer.discardTimer();
      toast.success("Task removed");
    } catch {
      toast.error("Could not remove task");
    }
  }

  async function handleCopyPlanner() {
    if (!copySourceDate) return;

    const sourceKey = toDateKey(copySourceDate);
    const targetKey = toDateKey(date);

    if (sourceKey === targetKey) {
      toast.error("Source aur target date same hain");
      return;
    }

    setIsCopying(true);
    try {
      const sourceData = await jfetch<{ tasks: PlannerTask[]; note: string }>(
        `/api/planner?date=${sourceKey}`
      );
      const srcTasks = sourceData?.tasks ?? [];
      const srcNote = (sourceData?.note ?? "").trim();

      if (srcTasks.length === 0 && !srcNote) {
        toast.info("Us date par copy karne ke liye kuch nahi hai");
        return;
      }

      for (const t of srcTasks) {
        await jfetch(`/api/planner`, {
          method: "POST",
          body: JSON.stringify({
            date: targetKey,
            title: t.title,
            subject: t.subject,
            priority: t.priority,
            estMinutes: t.estMinutes,
            description: t.description,
          }),
        });
      }

      if (srcNote) {
        const existing = note.trim();
        const merged =
          existing && existing !== srcNote ? `${existing}\n\n${srcNote}` : srcNote;
        await jfetch(`/api/planner/note`, {
          method: "PUT",
          body: JSON.stringify({ date: targetKey, content: merged }),
        });
      }

      await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "planner" });

      toast.success(`Planner copied from ${fmtDateLabel(copySourceDate)}`);
      setCopyOpen(false);
      setCopySourceDate(undefined);
    } catch (e) {
      console.error(e);
      toast.error("Failed to copy planner");
    } finally {
      setIsCopying(false);
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

  // Timer panel numbers
  const estMs = timerState.estMinutes * 60000;
  const timerPct = estMs ? Math.min(100, (elapsedMs / estMs) * 100) : 0;
  const overMs = estMs && elapsedMs > estMs ? elapsedMs - estMs : 0;

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
        {/* ============ LEFT: date, add task, checklist ============ */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* ---------------- date bar ---------------- */}
          <GlassCard className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl text-white/60 hover:bg-white/5 hover:text-white"
                  onClick={() => shiftDay(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:min-w-[240px] sm:flex-none sm:px-4">
                      <CalendarDays className="h-4 w-4 shrink-0 text-violet-300" />
                      <span className="truncate">{fmtDateLabel(date)}</span>
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
                  className="h-9 w-9 shrink-0 rounded-xl text-white/60 hover:bg-white/5 hover:text-white"
                  onClick={() => shiftDay(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Popover open={copyOpen} onOpenChange={setCopyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Planner
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <CalendarIcon className="h-4 w-4 text-violet-300" />
                        Copy planner from date
                      </div>
                      <Calendar
                        mode="single"
                        selected={copySourceDate}
                        onSelect={setCopySourceDate}
                      />
                      {copySourceDate && (
                        <div className="flex items-center justify-between gap-2 pt-2">
                          <span className="text-xs text-white/40">
                            From {fmtDateLabel(copySourceDate)}
                          </span>
                          <Button
                            size="sm"
                            onClick={handleCopyPlanner}
                            disabled={isCopying}
                            className="rounded-lg bg-violet-600 text-white hover:bg-violet-500"
                          >
                            {isCopying ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Confirm Copy"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

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
            </div>
          </GlassCard>

          {/* ---------------- add task ---------------- */}
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

          {/* ---------------- checklist ---------------- */}
          <GlassCard className="p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <ListTodo className="h-4 w-4 shrink-0 text-violet-300" />
              <span className="truncate">Checklist for {fmtDateLabel(date)}</span>
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
                    const isActive = timerOnThisDate && timerState.activeTaskId === task.id;
                    const isRunning = isActive && timer.isRunning;
                    const studiedMs =
                      (task.studiedSeconds ?? 0) * 1000 + (isActive ? elapsedMs : 0);

                    return (
                      <motion.li
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors",
                          done && "bg-white/[0.01] opacity-60",
                          isActive && "border-violet-400/40 bg-violet-500/[0.06]"
                        )}
                      >
                        <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
                          {/* manual complete */}
                          <button
                            onClick={() => handleToggle(task)}
                            disabled={toggleTask.isPending || timer.isSaving}
                            title={done ? "Mark as pending" : "Mark as complete"}
                            className="mt-0.5 shrink-0 text-violet-300 transition-transform hover:scale-110 disabled:opacity-50"
                          >
                            {done ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Circle className="h-5 w-5 text-white/25" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 basis-[calc(100%-2.5rem)] sm:basis-auto">
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
                              {studiedMs >= 1000 && (
                                <span className="flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">
                                  <TimerIcon className="h-2.5 w-2.5" /> Studied{" "}
                                  {fmtStudied(studiedMs)}
                                </span>
                              )}
                              {isRunning && (
                                <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-200">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                                  {fmtClock(elapsedMs)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="ml-auto flex shrink-0 items-center gap-1">
                            {!done &&
                              (isRunning ? (
                                <button
                                  onClick={timer.pauseTimer}
                                  title="Pause timer"
                                  className="flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
                                >
                                  <Pause className="h-3 w-3" /> Pause
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    timer.startTimer(task, toDateKey(date))
                                  }
                                  disabled={timer.isSaving}
                                  title={isActive ? "Resume timer" : "Start study timer"}
                                  className="flex items-center gap-1 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-200 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
                                >
                                  <Play className="h-3 w-3" />
                                  {isActive ? "Resume" : "Start timer"}
                                </button>
                              ))}

                            <button
                              onClick={() => handleDelete(task)}
                              className="rounded-lg p-1.5 text-white/25 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                              title="Remove task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </GlassCard>
        </div>

        {/* ============ RIGHT: timer, notes, summary ============ */}
        <div className="min-w-0 space-y-6">
          <AnimatePresence initial={false}>
            {timerActive && (
              <motion.div
                key="study-timer"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="lg:sticky lg:top-4 lg:z-10"
              >
                <GlassPanel className="border-violet-400/30 p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <TimerIcon className="h-4 w-4 text-violet-300" /> Study timer
                    </h3>
                    <span
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        timer.isRunning
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          : "border-amber-400/30 bg-amber-500/10 text-amber-200"
                      )}
                    >
                      {timer.isRunning && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                      )}
                      {timer.isRunning ? "Running" : "Paused"}
                    </span>
                  </div>

                  <p className="truncate text-sm text-white/70" title={timerState.title}>
                    {timerState.title}
                  </p>

                  <div className="my-4 text-center font-mono text-4xl font-semibold tracking-tight text-white">
                    {fmtClock(elapsedMs)}
                  </div>

                  {estMs > 0 && (
                    <div className="mb-4">
                      <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/40">
                        <span>Planned {timerState.estMinutes}m</span>
                        {overMs > 0 ? (
                          <span className="text-amber-300">+{fmtClock(overMs)} over</span>
                        ) : (
                          <span>{Math.round(timerPct)}%</span>
                        )}
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width] duration-500",
                            overMs > 0
                              ? "bg-amber-400"
                              : "bg-gradient-to-r from-violet-400 to-electric-400"
                          )}
                          style={{ width: `${timerPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!timerOnThisDate && (
                    <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50">
                      Ye task {fmtDateLabel(fromDateKey(timerState.dateKey))} ka hai.
                      <button
                        onClick={() => setDate(fromDateKey(timerState.dateKey))}
                        className="mt-2 flex items-center gap-1 font-medium text-violet-300 hover:text-violet-200"
                      >
                        Go to that date <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {timer.isRunning ? (
                      <Button
                        onClick={timer.pauseTimer}
                        variant="outline"
                        className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Pause className="mr-1.5 h-4 w-4" /> Pause
                      </Button>
                    ) : (
                      <Button
                        onClick={timer.resumeTimer}
                        className="rounded-xl bg-violet-600 text-white hover:bg-violet-500"
                      >
                        <Play className="mr-1.5 h-4 w-4" /> Resume
                      </Button>
                    )}
                    <Button
                      onClick={() => timer.stopTimer(false)}
                      disabled={timer.isSaving}
                      variant="outline"
                      className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      {timer.isSaving ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Square className="mr-1.5 h-4 w-4" />
                      )}
                      Stop &amp; save
                    </Button>
                  </div>

                  <Button
                    onClick={() => timer.stopTimer(true)}
                    disabled={timer.isSaving}
                    className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {timer.isSaving ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 h-4 w-4" />
                    )}
                    Finish &amp; mark complete
                  </Button>

                  <p className="mt-3 text-[11px] leading-relaxed text-white/30">
                    "Stop &amp; save" se study time save hota hai aur task pending rehta hai. Timer
                    page refresh karne par bhi chalta rahega.
                  </p>
                </GlassPanel>
              </motion.div>
            )}
          </AnimatePresence>

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
              <SummaryRow
                label="Studied (timer)"
                value={fmtStudied(studiedTodayMs)}
                accent="emerald"
              />
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
  value: number | string;
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