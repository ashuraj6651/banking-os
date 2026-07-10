"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Volume2,
  VolumeX,
  Flame,
  Target,
  Timer,
  ChevronRight,
  Settings2,
  X,
  Check,
} from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard, GlassPanel } from "../GlassCard";
import { cn } from "@/lib/utils";

/* ─── constants ─── */
const FOCUS_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;
const SESSIONS_BEFORE_LONG = 4;
const STORAGE_KEY = "bankos-pomodoro";
const SOUND_KEY = "bankos-pomodoro-sound";
const STATS_KEY = "bankos-pomodoro-stats";
const DURATIONS_KEY = "bankos-pomodoro-durations";

type TimerMode = "focus" | "shortBreak" | "longBreak";

interface TimerDurations {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

const DEFAULT_DURATIONS: TimerDurations = {
  focus: FOCUS_MINUTES,
  shortBreak: SHORT_BREAK_MINUTES,
  longBreak: LONG_BREAK_MINUTES,
};

function loadDurations(): TimerDurations {
  if (typeof window === "undefined") return DEFAULT_DURATIONS;
  try {
    const raw = localStorage.getItem(DURATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TimerDurations>;
      return {
        focus: clampMinutes(parsed.focus, DEFAULT_DURATIONS.focus),
        shortBreak: clampMinutes(parsed.shortBreak, DEFAULT_DURATIONS.shortBreak),
        longBreak: clampMinutes(parsed.longBreak, DEFAULT_DURATIONS.longBreak),
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_DURATIONS;
}

function saveDurations(durations: TimerDurations) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DURATIONS_KEY, JSON.stringify(durations));
  } catch {
    // ignore
  }
}

function clampMinutes(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(180, Math.max(1, Math.round(n)));
}

const MODE_CONFIG: Record<TimerMode, { label: string; minutes: number; color: string; gradient: string; icon: typeof Brain }> = {
  focus: { label: "Focus", minutes: FOCUS_MINUTES, color: "#8b5cf6", gradient: "from-violet-500 to-electric-500", icon: Brain },
  shortBreak: { label: "Short Break", minutes: SHORT_BREAK_MINUTES, color: "#22d3ee", gradient: "from-cyan-400 to-electric-500", icon: Coffee },
  longBreak: { label: "Long Break", minutes: LONG_BREAK_MINUTES, color: "#10b981", gradient: "from-emerald-400 to-cyan-400", icon: Coffee },
};

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Focus on the process, not the outcome.",
  "Small daily improvements lead to staggering results.",
  "Your only limit is the one you set for yourself.",
  "Success is the sum of small efforts, repeated daily.",
  "Discipline is choosing between what you want now and what you want most.",
  "Don't watch the clock; do what it does. Keep going.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Every expert was once a beginner.",
  "Consistency beats intensity. Show up every day.",
  "Banking exams reward the persistent, not just the brilliant.",
  "One more question. One more concept. You're getting closer.",
];

interface TimerState {
  mode: TimerMode;
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  sessionsCompleted: number;
  _savedAt?: number;
}

interface DayStats {
  date: string;
  totalFocusMinutes: number;
  sessionsCompleted: number;
  streak: number;
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadTimerState(): TimerState {
  if (typeof window === "undefined") {
    return {
      mode: "focus",
      remainingSeconds: FOCUS_MINUTES * 60,
      totalSeconds: FOCUS_MINUTES * 60,
      isRunning: false,
      sessionsCompleted: 0,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TimerState;
      // If the timer was running, calculate elapsed time
      if (parsed.isRunning && parsed._savedAt) {
        const elapsed = Math.floor((Date.now() - parsed._savedAt) / 1000);
        const newRemaining = parsed.remainingSeconds - elapsed;
        if (newRemaining <= 0) {
          // Timer would have expired — reset to same mode but not running
          return {
            mode: parsed.mode,
            remainingSeconds: MODE_CONFIG[parsed.mode].minutes * 60,
            totalSeconds: MODE_CONFIG[parsed.mode].minutes * 60,
            isRunning: false,
            sessionsCompleted: parsed.sessionsCompleted,
          };
        }
        return {
          ...parsed,
          remainingSeconds: newRemaining,
          _savedAt: undefined,
        } as TimerState;
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return {
    mode: "focus",
    remainingSeconds: FOCUS_MINUTES * 60,
    totalSeconds: FOCUS_MINUTES * 60,
    isRunning: false,
    sessionsCompleted: 0,
  };
}

function saveTimerState(state: TimerState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, _savedAt: Date.now() }));
  } catch {
    // ignore
  }
}

function loadDayStats(): DayStats {
  if (typeof window === "undefined") {
    return { date: getTodayStr(), totalFocusMinutes: 0, sessionsCompleted: 0, streak: 0 };
  }
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DayStats;
      if (parsed.date === getTodayStr()) return parsed;
      // New day — compute streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const streak = parsed.date === yesterdayStr && parsed.sessionsCompleted > 0 ? parsed.streak + 1 : parsed.sessionsCompleted > 0 ? 1 : 0;
      return { date: getTodayStr(), totalFocusMinutes: 0, sessionsCompleted: 0, streak };
    }
  } catch {
    // ignore
  }
  return { date: getTodayStr(), totalFocusMinutes: 0, sessionsCompleted: 0, streak: 0 };
}

function saveDayStats(stats: DayStats) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

/* ─── Web Audio beep ─── */
function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 680;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);

    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 880;
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
    osc2.start(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 1.1);
  } catch {
    // ignore if audio not available
  }
}

/* ─── Timer ring component ─── */
function TimerRing({
  progress,
  timeDisplay,
  mode,
}: {
  progress: number;
  timeDisplay: string;
  mode: TimerMode;
}) {
  const config = MODE_CONFIG[mode];
  const size = 260;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  const gid = "pomodoro-ring";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow backdrop */}
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-2xl"
        style={{ background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)` }}
      />
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={mode === "focus" ? "#8b5cf6" : mode === "shortBreak" ? "#22d3ee" : "#10b981"} />
            <stop offset="100%" stopColor={mode === "focus" ? "#22d3ee" : mode === "shortBreak" ? "#8b5cf6" : "#22d3ee"} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 10px ${config.color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tracking-tight text-white sm:text-6xl tabular-nums">
          {timeDisplay}
        </span>
        <span className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
          {config.label}
        </span>
      </div>
    </div>
  );
}

/* ─── Mode selector pill ─── */
function ModeSelector({
  activeMode,
  onSelect,
}: {
  activeMode: TimerMode;
  onSelect: (mode: TimerMode) => void;
}) {
  const modes: TimerMode[] = ["focus", "shortBreak", "longBreak"];
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-1">
      {modes.map((mode) => {
        const config = MODE_CONFIG[mode];
        const Icon = config.icon;
        const active = activeMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-300",
              active
                ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                : "text-white/40 hover:text-white/70"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main component ─── */
export function StudyTimer() {
  const [timerState, setTimerState] = useState<TimerState>(loadTimerState);
  const [dayStats, setDayStats] = useState<DayStats>(loadDayStats);
  const [durations, setDurations] = useState<TimerDurations>(loadDurations);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [durationDraft, setDurationDraft] = useState<TimerDurations>(durations);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const raw = localStorage.getItem(SOUND_KEY);
    return raw !== null ? raw === "true" : true;
  });
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(timerState.isRunning);

  // Keep isRunningRef in sync
  useEffect(() => {
    isRunningRef.current = timerState.isRunning;
  }, [timerState.isRunning]);

  // On mount: if a custom duration was saved and the timer isn't running,
  // make sure the displayed time reflects it (loadTimerState() runs before
  // durations are known, so it can't do this itself).
  useEffect(() => {
    setTimerState((prev) => {
      if (prev.isRunning) return prev;
      const minutes = durations[prev.mode];
      if (prev.totalSeconds === minutes * 60) return prev;
      return { ...prev, remainingSeconds: minutes * 60, totalSeconds: minutes * 60 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist timer state
  useEffect(() => {
    saveTimerState(timerState);
  }, [timerState]);

  // Persist sound preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SOUND_KEY, String(soundEnabled));
    }
  }, [soundEnabled]);

  // Rotate quotes during focus
  useEffect(() => {
    if (timerState.isRunning && timerState.mode === "focus") {
      const id = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
      }, 30000);
      return () => clearInterval(id);
    }
  }, [timerState.isRunning, timerState.mode]);

  // Handle timer completion — defined before the tick effect
  const handleTimerComplete = useCallback((prev: TimerState): TimerState => {
    if (prev.mode === "focus") {
      const newSessions = prev.sessionsCompleted + 1;
      const newStats: DayStats = {
        ...dayStats,
        sessionsCompleted: dayStats.sessionsCompleted + 1,
        totalFocusMinutes: dayStats.totalFocusMinutes + Math.round(prev.totalSeconds / 60),
        streak: dayStats.streak === 0 ? 1 : dayStats.streak,
      };
      setDayStats(newStats);
      saveDayStats(newStats);

      const nextMode: TimerMode = newSessions % SESSIONS_BEFORE_LONG === 0 ? "longBreak" : "shortBreak";
      const nextMinutes = durations[nextMode];
      return {
        mode: nextMode,
        remainingSeconds: nextMinutes * 60,
        totalSeconds: nextMinutes * 60,
        isRunning: true,
        sessionsCompleted: newSessions,
      };
    } else {
      const nextMinutes = durations.focus;
      return {
        mode: "focus",
        remainingSeconds: nextMinutes * 60,
        totalSeconds: nextMinutes * 60,
        isRunning: true,
        sessionsCompleted: prev.sessionsCompleted,
      };
    }
  }, [dayStats, durations]);

  // Timer tick
  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          const next = prev.remainingSeconds - 1;
          if (next <= 0) {
            if (soundEnabled) playBeep();
            return handleTimerComplete(prev);
          }
          return { ...prev, remainingSeconds: next };
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState.isRunning, soundEnabled, handleTimerComplete]);

  const toggleRunning = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const resetTimer = useCallback(() => {
    const minutes = durations[timerState.mode];
    setTimerState((prev) => ({
      ...prev,
      remainingSeconds: minutes * 60,
      totalSeconds: minutes * 60,
      isRunning: false,
    }));
  }, [timerState.mode, durations]);

  const switchMode = useCallback((mode: TimerMode) => {
    const minutes = durations[mode];
    setTimerState((prev) => ({
      ...prev,
      mode,
      remainingSeconds: minutes * 60,
      totalSeconds: minutes * 60,
      isRunning: false,
    }));
  }, [durations]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  // Persist duration preferences, and apply new durations to the
  // current mode immediately if the timer isn't running right now.
  const applyDurations = useCallback((next: TimerDurations) => {
    setDurations(next);
    saveDurations(next);
    setTimerState((prev) => {
      if (prev.isRunning) return prev; // don't yank time out from under an active session
      const minutes = next[prev.mode];
      return { ...prev, remainingSeconds: minutes * 60, totalSeconds: minutes * 60 };
    });
  }, []);

  // Computed
  const progress = timerState.totalSeconds > 0
    ? ((timerState.totalSeconds - timerState.remainingSeconds) / timerState.totalSeconds) * 100
    : 0;
  const minutes = Math.floor(timerState.remainingSeconds / 60);
  const seconds = timerState.remainingSeconds % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const currentConfig = MODE_CONFIG[timerState.mode];
  const sessionInCycle = (timerState.sessionsCompleted % SESSIONS_BEFORE_LONG) + (timerState.mode === "focus" ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ViewHeader
        badge="Focus"
        badgeIcon={<Clock className="h-3 w-3" />}
        title="Study Timer"
        subtitle={`Pomodoro technique — focused ${durations.focus}-min sprints with strategic breaks`}
        actions={
          <>
            <button
              onClick={() => {
                setDurationDraft(durations);
                setSettingsOpen((v) => !v);
              }}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-xl border transition-colors",
                settingsOpen
                  ? "border-violet-400/40 bg-violet-500/10 text-violet-300"
                  : "border-white/10 bg-white/5 text-white/60 hover:text-white"
              )}
              title="Customise timer durations"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={toggleSound}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-xl border transition-colors",
                soundEnabled
                  ? "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  : "border-white/5 text-white/25"
              )}
              title={soundEnabled ? "Mute notifications" : "Enable notifications"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </>
        }
      />

      {/* Duration settings panel */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <GlassCard hover={false}>
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Timer Durations</h3>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {(["focus", "shortBreak", "longBreak"] as TimerMode[]).map((mode) => (
                    <div key={mode}>
                      <label className="mb-1.5 block text-xs text-white/50">
                        {MODE_CONFIG[mode].label}
                      </label>
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={durationDraft[mode]}
                          onChange={(e) =>
                            setDurationDraft((prev) => ({
                              ...prev,
                              [mode]: e.target.value === "" ? 0 : Number(e.target.value),
                            }))
                          }
                          className="w-full bg-transparent text-sm text-white focus:outline-none tabular-nums"
                        />
                        <span className="shrink-0 text-xs text-white/40">min</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDurationDraft(DEFAULT_DURATIONS)}
                    className="rounded-xl px-3 py-2 text-xs text-white/40 hover:text-white/70"
                  >
                    Reset to defaults
                  </button>
                  <button
                    onClick={() => {
                      const clamped: TimerDurations = {
                        focus: clampMinutes(durationDraft.focus, DEFAULT_DURATIONS.focus),
                        shortBreak: clampMinutes(durationDraft.shortBreak, DEFAULT_DURATIONS.shortBreak),
                        longBreak: clampMinutes(durationDraft.longBreak, DEFAULT_DURATIONS.longBreak),
                      };
                      applyDurations(clamped);
                      setSettingsOpen(false);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-4 py-2 text-xs font-medium text-white shadow-lg hover:shadow-violet-500/30"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save
                  </button>
                </div>
                {timerState.isRunning && (
                  <p className="mt-3 text-xs text-amber-300/70">
                    Timer is currently running — new durations will apply from the next session.
                  </p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer card */}
      <GlassCard hover={false} className="relative overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-electric-500/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-8 p-6 sm:p-10">
          {/* Mode selector */}
          <ModeSelector activeMode={timerState.mode} onSelect={switchMode} />

          {/* Timer ring */}
          <TimerRing progress={progress} timeDisplay={timeDisplay} mode={timerState.mode} />

          {/* Controls */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={resetTimer}
              className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
              title="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleRunning}
              className={cn(
                "grid h-16 w-16 place-items-center rounded-3xl text-white shadow-xl transition-shadow",
                `bg-gradient-to-b ${currentConfig.gradient}`,
                timerState.isRunning
                  ? "shadow-violet-500/20 hover:shadow-violet-500/40"
                  : "shadow-violet-500/30 hover:shadow-violet-500/50"
              )}
              title={timerState.isRunning ? "Pause" : "Start"}
            >
              {timerState.isRunning ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                const nextMode: TimerMode = timerState.mode === "focus"
                  ? (timerState.sessionsCompleted % SESSIONS_BEFORE_LONG === 3 ? "longBreak" : "shortBreak")
                  : "focus";
                switchMode(nextMode);
              }}
              className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
              title="Skip to next"
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Session progress dots */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">Sessions</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: SESSIONS_BEFORE_LONG }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all duration-500",
                    i < timerState.sessionsCompleted % SESSIONS_BEFORE_LONG
                      ? "bg-gradient-to-br from-violet-400 to-electric-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                      : i === timerState.sessionsCompleted % SESSIONS_BEFORE_LONG && timerState.mode === "focus"
                        ? "border border-violet-400/50 bg-violet-500/20"
                        : "bg-white/10"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-white/50">
              #{timerState.sessionsCompleted + (timerState.mode === "focus" ? 1 : 0)}
            </span>
          </div>

          {/* Motivational quote (only during focus) */}
          <AnimatePresence mode="wait">
            {timerState.mode === "focus" && (
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                className="max-w-md text-center text-sm italic text-white/30 transition-colors"
              >
                &ldquo;{QUOTES[quoteIndex]}&rdquo;
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total focus minutes today */}
        <GlassCard delay={0.05}>
          <div className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
              <Clock className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {dayStats.totalFocusMinutes}
                <span className="ml-1 text-sm font-normal text-white/40">min</span>
              </div>
              <div className="text-xs text-white/40">Focus time today</div>
            </div>
          </div>
        </GlassCard>

        {/* Sessions completed today */}
        <GlassCard delay={0.1}>
          <div className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <Target className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {dayStats.sessionsCompleted}
                <span className="ml-1 text-sm font-normal text-white/40">
                  {dayStats.sessionsCompleted === 1 ? "session" : "sessions"}
                </span>
              </div>
              <div className="text-xs text-white/40">Completed today</div>
            </div>
          </div>
        </GlassCard>

        {/* Current streak */}
        <GlassCard delay={0.15}>
          <div className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Flame className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {dayStats.streak}
                <span className="ml-1 text-sm font-normal text-white/40">
                  {dayStats.streak === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="text-xs text-white/40">Timer streak</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* How it works */}
      <GlassCard hover={false} delay={0.2}>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4">How Pomodoro Works</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { step: "1", title: "Focus", desc: `${durations.focus} minutes of deep work`, color: "text-violet-300", border: "border-violet-500/20" },
              { step: "2", title: "Short Break", desc: `${durations.shortBreak} minutes to recharge`, color: "text-cyan-300", border: "border-cyan-500/20" },
              { step: "3", title: "Repeat", desc: "3 more focus cycles", color: "text-violet-300", border: "border-violet-500/20" },
              { step: "4", title: "Long Break", desc: `${durations.longBreak} minutes rest`, color: "text-emerald-300", border: "border-emerald-500/20" },
            ].map((item) => (
              <div
                key={item.step}
                className={cn(
                  "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center"
                )}
              >
                <div className={cn(
                  "mx-auto mb-2 grid h-8 w-8 place-items-center rounded-xl border bg-white/[0.03] text-sm font-bold",
                  item.border,
                  item.color
                )}>
                  {item.step}
                </div>
                <div className="text-sm font-medium text-white/80">{item.title}</div>
                <div className="mt-1 text-xs text-white/40">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}