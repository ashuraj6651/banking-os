import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBJECT_COLORS: Record<string, string> = {
  Reasoning: "#8b5cf6",
  English: "#22d3ee",
  Quant: "#3b82f6",
  Banking: "#f59e0b",
  "Current Affairs": "#10b981",
  Computer: "#ec4899",
};

// GET /api/analytics — computed from real attempts
export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ empty: true });
  }

  // These three don't depend on each other — fetch together instead of
  // one after another. This also means we only fetch `attempts` ONCE and
  // reuse it below, instead of the old code re-fetching the same attempts
  // 3 separate times (once here, once in computeSubjectMastery, once again
  // inside computeReadiness) — that redundant re-fetching was the main
  // reason this route was taking 11+ seconds.
  const [attempts, sessions, mocks] = await Promise.all([
    db.attempt.findMany({
      where: { profileId: profile.id },
      include: { question: { select: { subject: true, topic: true } } },
      orderBy: { date: "asc" },
    }),
    db.studySession.findMany({
      where: { profileId: profile.id },
      orderBy: { startedAt: "asc" },
    }),
    db.mockTest.findMany({
      where: { profileId: profile.id, status: "completed" },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // last 14 days study hours from sessions
  const last14: { day: string; hours: number; accuracy: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const daySessions = sessions.filter(
      (s) => s.startedAt >= d && s.startedAt < next
    );
    const hours = daySessions.reduce((a, s) => a + s.durationSec / 3600, 0);
    const dayAttempts = attempts.filter(
      (a) => a.date >= d && a.date < next
    );
    const dayCorrect = dayAttempts.filter((a) => a.correct).length;
    const dayAcc = dayAttempts.length > 0 ? Math.round((dayCorrect / dayAttempts.length) * 100) : 0;
    last14.push({ day: dayLabel, hours: Math.round(hours * 10) / 10, accuracy: dayAcc });
  }

  const mockHistory = mocks.map((m, i) => ({
    name: `M${i + 1}`,
    score: m.score ?? 0,
    percentile: Math.min(99, Math.round((m.score ?? 0) * 0.95 + 5)),
  }));

  // section time from attempts (avg time per subject)
  const subjectTime: Record<string, { total: number; count: number; correct: number }> = {};
  for (const a of attempts) {
    const s = a.question.subject;
    if (!subjectTime[s]) subjectTime[s] = { total: 0, count: 0, correct: 0 };
    subjectTime[s].total += a.timeTakenSec;
    subjectTime[s].count++;
    if (a.correct) subjectTime[s].correct++;
  }
  const sectionTime = Object.entries(subjectTime).map(([section, v]) => ({
    section,
    time: v.count > 0 ? Math.round(v.total / v.count) : 0,
    accuracy: v.count > 0 ? Math.round((v.correct / v.count) * 100) : 0,
  }));

  // subject mastery — computed locally from `attempts` we already have,
  // instead of calling computeSubjectMastery() which would re-query the DB.
  const SUBJECTS = ["Reasoning", "English", "Quant", "Banking", "Current Affairs"];
  const mastery = SUBJECTS.map((subject) => ({
    subject,
    mastery: subjectTime[subject]
      ? Math.round((subjectTime[subject].correct / subjectTime[subject].count) * 100)
      : 0,
    color: SUBJECT_COLORS[subject] ?? "#8b5cf6",
  }));

  // readiness — same formula as computeReadiness(), but reusing the data
  // we already fetched above instead of re-querying attempts/mocks/sessions.
  const withData = mastery.filter((m) => m.mastery > 0);
  const avgMastery =
    withData.length > 0
      ? Math.round(withData.reduce((a, b) => a + b.mastery, 0) / withData.length)
      : 0;
  const coverage = withData.length / 5;
  const overall = Math.round(avgMastery * 0.7 + coverage * 100 * 0.3);
  const volumeFactor = Math.min(1, totalAttempts / 200);
  const selectionProbability = Math.round(overall * 0.6 + accuracy * 100 * 0.25 + volumeFactor * 15);

  let predictedRank: number | null = null;
  if (mocks.length > 0) {
    const avgScore = mocks.reduce((a, m) => a + (m.score ?? 0), 0) / mocks.length;
    predictedRank = Math.max(1, Math.round(10000 - avgScore * 95));
  }

  const expectedCutoff = 78.5;
  const preparationLevel =
    overall >= 85 ? "Elite" : overall >= 70 ? "Advanced" : overall >= 50 ? "Intermediate" : overall > 0 ? "Building" : "Beginner";
  const confidence = Math.round(accuracy * 100);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todaySessions = sessions.filter((s) => s.startedAt >= startOfDay);
  const todayQuestions = todaySessions.reduce((a, s) => a + s.questionsAttempted, 0);
  const focusScore = Math.min(100, Math.round(todayQuestions * 4 + todaySessions.length * 8));

  const readiness = {
    overall,
    selectionProbability,
    predictedRank,
    expectedCutoff,
    preparationLevel,
    confidence,
    focusScore,
  };

  // total study hours
  const totalHours = Math.round(
    (sessions.reduce((a, s) => a + s.durationSec, 0) / 3600) * 10
  ) / 10;

  // topic-level mastery for strong/weak
  const topicStats: Record<string, { total: number; correct: number }> = {};
  for (const a of attempts) {
    const t = a.question.topic;
    if (!topicStats[t]) topicStats[t] = { total: 0, correct: 0 };
    topicStats[t].total++;
    if (a.correct) topicStats[t].correct++;
  }
  const topicMastery = Object.entries(topicStats)
    .map(([t, v]) => ({
      topic: t,
      mastery: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      attempts: v.total,
    }))
    .filter((t) => t.attempts >= 1)
    .sort((a, b) => b.mastery - a.mastery);

  return NextResponse.json({
    totalAttempts,
    correctAttempts,
    accuracy,
    totalHours,
    mocksTaken: mocks.length,
    studyHours: last14,
    mockHistory,
    sectionTime,
    mastery,
    topicMastery,
    readiness,
    sessionsCount: sessions.length,
  });
}