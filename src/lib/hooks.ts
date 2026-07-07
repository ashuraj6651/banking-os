"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function jfetch<T>(url: string, opts?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = 30000, ...rest } = opts ?? {};

  // Guard against requests that never resolve (e.g. a hung AI call on the
  // server). Without this, a stuck backend call left the "Loading..." UI
  // spinning forever with no way for the user to recover.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller.signal,
      ...rest,
    });
  } catch (e) {
    if (controller.signal.aborted) {
      throw new Error("Request timed out. Please try again.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    // Parse the server's error message so callers can show it to the user
    let serverMsg = "";
    try {
      const body = await res.json();
      serverMsg = body?.error ?? body?.message ?? "";
    } catch {
      // response wasn't JSON
    }
    const err = new Error(serverMsg || `Request failed (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

// ---------- types ----------
export type Profile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  exam: string;
  targetDate: string;
  studyHoursPerDay: number;
  weakSubjects: string;
  streak: number;
  level: number;
  xp: number;
  coins: number;
  roadmap: string;
  createdAt: string;
};

export type Mission = {
  id: string;
  date: string;
  title: string;
  type: string;
  duration: number;
  done: boolean;
  order: number;
};

export type Question = {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  text: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Readiness = {
  overall: number;
  selectionProbability: number;
  predictedRank: number | null;
  expectedCutoff: number;
  preparationLevel: string;
  confidence: number;
  focusScore: number;
};

// ---------- hooks ----------
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => jfetch<{ profile: Profile | null }>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name?: string;
      avatarUrl?: string | null;
      exam?: string;
      goal?: string;
      roadmap?: string;
    }) => jfetch<{ profile: Profile }>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
}

export function useProfileStats() {
  return useQuery({
    queryKey: ["profile-stats"],
    queryFn: () =>
      jfetch<{
        empty?: boolean;
        profile?: Profile;
        stats?: {
          attempts: number;
          correct: number;
          accuracy: number;
          sessions: number;
          mocks: number;
          daysRemaining: number;
          achievements: string[];
        };
        readiness?: Readiness;
        heatmap?: number[];
      }>("/api/profile/stats"),
  });
}

export function useMissions() {
  return useQuery({
    queryKey: ["missions"],
    queryFn: () => jfetch<{ missions: Mission[] }>("/api/missions"),
  });
}

export function useToggleMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jfetch(`/api/missions/${id}`, { method: "PATCH" }),
    // Flip the checkbox in the local cache immediately instead of waiting
    // for the PATCH + refetch round trip — this is what was making the
    // checklist feel like it took 4-5s to respond.
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["missions"] });
      const previous = qc.getQueryData<{ missions: Mission[] }>(["missions"]);
      qc.setQueryData<{ missions: Mission[] } | undefined>(["missions"], (old) => {
        if (!old) return old;
        return {
          missions: old.missions.map((m) => (m.id === id ? { ...m, done: !m.done } : m)),
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      // Roll back if the server call actually failed.
      if (context?.previous) qc.setQueryData(["missions"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["missions"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
}

export function useQuestions(subject?: string, difficulty?: string, refreshKey = 0, topic?: string) {
  const params = new URLSearchParams();
  if (subject && subject !== "All") params.set("subject", subject);
  if (difficulty && difficulty !== "All") params.set("difficulty", difficulty);
  if (topic) params.set("topic", topic);
  if (refreshKey > 0) params.set("refresh", "true");
  return useQuery({
    queryKey: ["questions", subject, difficulty, refreshKey, topic],
    // Generous timeout since this can trigger AI question generation on the
    // server, but capped so a hung Groq call can't spin the UI forever.
    queryFn: () =>
      jfetch<{ questions: Question[] }>(`/api/questions?${params}`, { timeoutMs: 45000 }),
    staleTime: 5 * 60 * 1000, // 5 min stale time for questions
    retry: 1,
  });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      questionId: string;
      selected: number | null;
      context: string;
      timeTakenSec?: number;
    }) =>
      jfetch<{
        correct: boolean;
        answer: number;
        explanation: string;
      }>("/api/attempts", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["errors"] });
      qc.invalidateQueries({ queryKey: ["revision"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
      qc.invalidateQueries({ queryKey: ["skilltree"] });
      qc.invalidateQueries({ queryKey: ["world"] });
      qc.invalidateQueries({ queryKey: ["readiness"] });
    },
  });
}

export function useStartSession() {
  return useMutation({
    mutationFn: () =>
      jfetch<{ session: { id: string } }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      }),
  });
}

export function useEndSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      sessionId: string;
      questionsAttempted: number;
      correctCount: number;
      durationSec: number;
    }) =>
      jfetch("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ action: "end", ...body }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
      qc.invalidateQueries({ queryKey: ["missions"] });
    },
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () =>
      jfetch<{
        empty?: boolean;
        totalAttempts: number;
        correctAttempts: number;
        accuracy: number;
        totalHours: number;
        mocksTaken: number;
        studyHours: { day: string; hours: number; accuracy: number }[];
        mockHistory: { name: string; score: number; percentile: number }[];
        sectionTime: { section: string; time: number; accuracy: number }[];
        mastery: { subject: string; mastery: number; color: string }[];
        topicMastery: { topic: string; mastery: number; attempts: number }[];
        readiness: Readiness;
        sessionsCount: number;
      }>("/api/analytics"),
  });
}

export function useErrors() {
  return useQuery({
    queryKey: ["errors"],
    queryFn: () =>
      jfetch<{
        errors: {
          id: string;
          questionId: string;
          question: string;
          subject: string;
          topic: string;
          reason: string;
          reviewed: boolean;
          date: string;
          explanation: string;
        }[];
      }>("/api/errors"),
  });
}

export function useToggleErrorReviewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jfetch("/api/errors", { method: "PATCH", body: JSON.stringify({ id }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["errors"] }),
  });
}

export function useRevision() {
  return useQuery({
    queryKey: ["revision"],
    queryFn: () =>
      revFetch(),
  });
}

async function revFetch() {
  return jfetch<{
    items: {
      id: string;
      topic: string;
      subject: string;
      dueDate: string;
      due: string;
      interval: number;
      strength: number;
      lastReview: string | null;
    }[];
  }>("/api/revision");
}

export function useReviewItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jfetch("/api/revision", { method: "POST", body: JSON.stringify({ id }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revision"] }),
  });
}

export function useCurrentAffairs() {
  return useQuery({
    queryKey: ["current-affairs"],
    queryFn: () =>
      jfetch<{
        items: {
          id: string;
          tag: string;
          title: string;
          summary: string;
          date: string;
          timeLabel: string;
        }[];
      }>("/api/current-affairs"),
  });
}

export function useReadiness() {
  return useQuery({
    queryKey: ["readiness"],
    queryFn: () =>
      jfetch<{ empty?: boolean; profile?: Profile; readiness?: Readiness }>("/api/readiness"),
  });
}

export function useSkillTree() {
  return useQuery({
    queryKey: ["skilltree"],
    queryFn: () =>
      jfetch<{
        empty?: boolean;
        tree: {
          id: string;
          name: string;
          mastery: number;
          color: string;
          unlocked: boolean;
          children: { id: string; name: string; mastery: number; unlocked: boolean; attempts: number }[];
        }[];
      }>("/api/skilltree"),
  });
}

export function useWorld() {
  return useQuery({
    queryKey: ["world"],
    queryFn: () =>
      jfetch<{
        empty?: boolean;
        regions: {
          id: string;
          name: string;
          icon: string;
          subject: string | null;
          color: string;
          desc: string;
          progress: number;
          unlocked: boolean;
        }[];
      }>("/api/world"),
  });
}

// ---------- mocks ----------
export function useMocks() {
  return useQuery({
    queryKey: ["mocks"],
    queryFn: () =>
      jfetch<{
        mocks: {
          id: string;
          title: string;
          startedAt: string;
          durationSec: number;
          status: string;
          score: number | null;
        }[];
      }>("/api/mocks"),
  });
}

export function useStartMock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; durationSec: number }) =>
      jfetch<{ mock: { id: string } }>("/api/mocks", {
        method: "POST",
        body: JSON.stringify({ action: "start", ...body }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mocks"] }),
  });
}

export function useCompleteMock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { mockId: string; score: number }) =>
      jfetch("/api/mocks", {
        method: "POST",
        body: JSON.stringify({ action: "complete", ...body }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mocks"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
}

export function useClearMocks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      jfetch<{ deleted: number }>("/api/mocks", {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mocks"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });
}

// ---------- auth ----------
export function useAuth() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: () =>
      jfetch<{
        account: { id: string; email: string; name: string } | null;
        hasProfile?: boolean;
      }>("/api/auth/me"),
    // Never serve auth from stale cache — always verify with the server
    staleTime: 0,
    gcTime: 0,
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string; name: string }) =>
      jfetch<{ account: { id: string; email: string; name: string } }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      // Wipe ALL cached queries so no previous user's data leaks into the new session
      qc.clear();
      // Explicitly refetch the auth query so the page re-routes immediately
      qc.refetchQueries({ queryKey: ["auth"] });
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      jfetch<{ account: { id: string; email: string; name: string } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      // Wipe ALL cached queries so no previous user's data leaks into the new session
      qc.clear();
      // Explicitly refetch the auth query so the page re-routes immediately
      qc.refetchQueries({ queryKey: ["auth"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => jfetch("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      // Wipe ALL cached queries so the next user never sees the previous user's data
      qc.clear();
      qc.refetchQueries({ queryKey: ["auth"] });
    },
  });
}

// ---------- backup ----------
export function useExportBackup() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/backup/export", { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      return res.json();
    },
  });
}

export function useImportBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      jfetch("/api/backup/import", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

// ---------- syllabus ----------
export function useSyllabus() {
  return useQuery({
    queryKey: ["syllabus"],
    queryFn: () =>
      jfetch<{
        progress: { subject: string; topic: string; checked: boolean; checkedAt: string | null }[];
      }>("/api/syllabus"),
  });
}

export function useToggleSyllabus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { subject: string; topic: string }) =>
      jfetch("/api/syllabus", { method: "PATCH", body: JSON.stringify(body) }),
    // Flip the checkbox in the local cache immediately instead of waiting on
    // the PATCH + refetch round trip — this is what made every tap on the
    // syllabus checklist feel like it took a few seconds to respond.
    onMutate: async ({ subject, topic }: { subject: string; topic: string }) => {
      await qc.cancelQueries({ queryKey: ["syllabus"] });
      const previous = qc.getQueryData<{
        progress: { subject: string; topic: string; checked: boolean; checkedAt: string | null }[];
      }>(["syllabus"]);

      qc.setQueryData<typeof previous>(["syllabus"], (old) => {
        const rows = old?.progress ?? [];
        const idx = rows.findIndex((p) => p.subject === subject && p.topic === topic);
        if (idx === -1) {
          // wasn't tracked yet — optimistically add it as checked
          return { progress: [...rows, { subject, topic, checked: true, checkedAt: new Date().toISOString() }] };
        }
        const next = [...rows];
        next[idx] = { ...next[idx], checked: !next[idx].checked };
        return { progress: next };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back if the server call actually failed.
      if (context?.previous) qc.setQueryData(["syllabus"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["syllabus"] }),
  });
}

// onboarding
export function useOnboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      exam: string;
      targetDate: string;
      studyHoursPerDay: number;
      weakSubjects: string[];
    }) =>
      jfetch<{ profile: Profile }>("/api/onboarding", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
      qc.invalidateQueries({ queryKey: ["missions"] });
    },
  });
}