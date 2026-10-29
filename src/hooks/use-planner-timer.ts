"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PlannerTask } from "@/lib/hooks";

export interface TimerState {
  activeTaskId: string | null;
  title: string;
  dateKey: string;
  estMinutes: number;
  accumulatedMs: number;
  startedAt: number | null;
}

const STORAGE_KEY = "bankos-planner-timer";

const EMPTY: TimerState = {
  activeTaskId: null,
  title: "",
  dateKey: "",
  estMinutes: 0,
  accumulatedMs: 0,
  startedAt: null,
};

function getElapsed(s: TimerState, nowMs: number) {
  return Math.max(0, s.accumulatedMs + (s.startedAt ? nowMs - s.startedAt : 0));
}

function isValidState(v: unknown): v is TimerState {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    (s.activeTaskId === null || typeof s.activeTaskId === "string") &&
    typeof s.title === "string" &&
    typeof s.dateKey === "string" &&
    typeof s.estMinutes === "number" &&
    typeof s.accumulatedMs === "number" &&
    (s.startedAt === null || typeof s.startedAt === "number")
  );
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Direct PATCH call. Hooks par depend nahi karta, isliye kisi bhi date ka task
 * (aur kisi bhi page se) safely update ho jata hai. Server ka asli error message
 * bhi surface hota hai.
 */
async function patchTask(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/planner/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.hint) msg = j.hint;
      else if (j?.error) msg = j.detail ? `${j.error}: ${j.detail}` : String(j.error);
    } catch {
      /* response wasn't JSON */
    }
    throw new ApiError(msg, res.status);
  }
  return res.json();
}

/**
 * Planner study timer.
 * `_date` argument sirf backward-compatibility ke liye hai (purane callers
 * `usePlannerTimer(date)` karte hain) — ab zaroorat nahi, kyunki timer apni
 * dateKey khud rakhta hai.
 */
export function usePlannerTimer(_date?: Date) {
  const qc = useQueryClient();

  const [state, setState] = useState<TimerState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Hamesha latest state — callbacks ko stale closure se bachane ke liye
  const stateRef = useRef(state);
  stateRef.current = state;
  const savingRef = useRef(false);
  const notifiedRef = useRef<string | null>(null);

  /* ---------- restore from localStorage (client only, no hydration mismatch) ---------- */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidState(parsed)) setState(parsed);
      }
    } catch {
      /* corrupted storage — ignore */
    }
    setHydrated(true);
  }, []);

  /* ---------- persist (restore hone ke baad hi, warna saved timer overwrite ho jata) ---------- */
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (state.activeTaskId) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  /* ---------- tick ---------- */
  useEffect(() => {
    if (!state.activeTaskId) {
      setElapsedMs(0);
      return;
    }
    if (!state.startedAt) {
      setElapsedMs(state.accumulatedMs);
      return;
    }
    const tick = () => setElapsedMs(getElapsed(stateRef.current, Date.now()));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [state.activeTaskId, state.startedAt, state.accumulatedMs]);

  /* ---------- browser tab title ---------- */
  const elapsedSecond = Math.floor(elapsedMs / 1000);
  useEffect(() => {
    if (!state.activeTaskId) return;
    const prev = document.title;
    const m = Math.floor(elapsedSecond / 60);
    const s = elapsedSecond % 60;
    document.title = `${state.startedAt ? "▶" : "⏸"} ${String(m).padStart(2, "0")}:${String(
      s
    ).padStart(2, "0")} · ${state.title || "BankOS"}`;
    return () => {
      document.title = prev;
    };
  }, [state.activeTaskId, state.startedAt, state.title, elapsedSecond]);

  /* ---------- planned time reached (sirf ek baar) ---------- */
  useEffect(() => {
    if (!state.activeTaskId || !state.startedAt || !state.estMinutes) return;
    const key = `${state.activeTaskId}-${state.dateKey}`;
    if (elapsedMs >= state.estMinutes * 60000 && notifiedRef.current !== key) {
      notifiedRef.current = key;
      toast.success(`Planned time reached: ${state.title}`, {
        description: "Task complete kar sakte ho ya timer chalu rakh sakte ho.",
      });
    }
  }, [elapsedMs, state.activeTaskId, state.startedAt, state.estMinutes, state.dateKey, state.title]);

  useEffect(() => {
    if (!state.activeTaskId) notifiedRef.current = null;
  }, [state.activeTaskId]);

  /* ---------- helpers ---------- */
  const refreshPlanner = useCallback(
    () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "planner" }),
    [qc]
  );

  const discardTimer = useCallback(() => {
    setState(EMPTY);
    toast.info("Timer discarded");
  }, []);

  /* ---------- actions ---------- */
  const pauseTimer = useCallback(() => {
    setState((prev) =>
      prev.startedAt
        ? { ...prev, accumulatedMs: getElapsed(prev, Date.now()), startedAt: null }
        : prev
    );
  }, []);

  const resumeTimer = useCallback(() => {
    setState((prev) =>
      prev.activeTaskId && !prev.startedAt ? { ...prev, startedAt: Date.now() } : prev
    );
  }, []);

  /**
   * Timer rokta hai aur studied time server par save karta hai.
   * markComplete=true  -> time + status "done" EK hi request mein (toggle nahi, isliye
   *                       already-done task wapas pending nahi hota).
   * Save fail ho to timer paused state mein bacha rehta hai — time lost nahi hota.
   */
  const stopTimer = useCallback(
    async (markComplete = false): Promise<boolean> => {
      const s = stateRef.current;
      if (!s.activeTaskId || savingRef.current) return false;

      savingRef.current = true;
      setIsSaving(true);

      const seconds = Math.floor(getElapsed(s, Date.now()) / 1000);
      const body: Record<string, unknown> = {};
      if (seconds > 0) body.addStudiedSeconds = seconds;
      if (markComplete) body.status = "done";

      try {
        if (Object.keys(body).length > 0) await patchTask(s.activeTaskId, body);
        setState(EMPTY);
        await refreshPlanner();
        toast.success(markComplete ? "Task completed!" : "Study time saved");
        return true;
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0;
        const message = e instanceof Error ? e.message : "Unknown error";

        if (status === 404) {
          // Task delete ho chuka hai — timer ka koi matlab nahi
          setState(EMPTY);
          toast.error("Ye task ab exist nahi karta, timer clear kar diya");
        } else {
          // Time bachaya: timer pause karo, user retry ya discard kar sake
          setState((prev) =>
            prev.activeTaskId === s.activeTaskId
              ? { ...prev, accumulatedMs: getElapsed(prev, Date.now()), startedAt: null }
              : prev
          );
          console.error("Timer save error:", e);
          toast.error(`Failed to save studied time — ${message}`, {
            action: { label: "Discard timer", onClick: discardTimer },
          });
        }
        return false;
      } finally {
        savingRef.current = false;
        setIsSaving(false);
      }
    },
    [refreshPlanner, discardTimer]
  );

  const startTimer = useCallback(
    async (task: PlannerTask, currentDateKey: string) => {
      const s = stateRef.current;

      // Same task: sirf resume
      if (s.activeTaskId === task.id) {
        if (!s.startedAt) resumeTimer();
        return;
      }
      if (savingRef.current) return;

      // Doosre task ka timer chal raha ho to uska time pehle save karo
      if (s.activeTaskId) {
        const seconds = Math.floor(getElapsed(s, Date.now()) / 1000);
        savingRef.current = true;
        setIsSaving(true);
        try {
          if (seconds > 0) await patchTask(s.activeTaskId, { addStudiedSeconds: seconds });
          await refreshPlanner();
          toast.info("Switched task: previous time saved");
        } catch (e) {
          const status = e instanceof ApiError ? e.status : 0;
          if (status !== 404) {
            console.error("Task switch save error:", e);
            toast.error(
              `Previous task ka time save nahi hua — ${e instanceof Error ? e.message : ""}`,
              { action: { label: "Discard timer", onClick: discardTimer } }
            );
            return; // switch mat karo, warna time lost ho jayega
          }
        } finally {
          savingRef.current = false;
          setIsSaving(false);
        }
      }

      setState({
        activeTaskId: task.id,
        title: task.title,
        dateKey: currentDateKey,
        estMinutes: task.estMinutes || 0,
        accumulatedMs: 0,
        startedAt: Date.now(),
      });
    },
    [resumeTimer, refreshPlanner, discardTimer]
  );

  return {
    state,
    elapsedMs,
    isRunning: !!state.startedAt,
    isSaving,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    discardTimer,
  };
}