import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getProfile,
  computeSubjectMastery,
  computeReadiness,
} from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/analytics — computed from real attempts
export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ empty: true });
  }

  const attempts = await db.attempt.findMany({
    where: { profileId: profile.id },
    include: { question: { select: { subject: true } } },
    orderBy: { date: "asc" },
  });

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // last 14 days study hours from sessions
  const sessions = await db.studySession.findMany({
    where: { profileId: profile.id },
    orderBy: { startedAt: "asc" },
  });
  const last14: { day: string; hours: number; accuracy: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayLabel = `D${14 - i}`;
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

  // mocks
  const mocks = await db.mockTest.findMany({
    where: { profileId: profile.id, status: "completed" },
    orderBy: { startedAt: "asc" },
  });
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

  const mastery = await computeSubjectMastery(profile.id);
  const readiness = await computeReadiness(profile.id);

  // total study hours
  const totalHours = Math.round(
    (sessions.reduce((a, s) => a + s.durationSec, 0) / 3600) * 10
  ) / 10;

  // topic-level mastery for strong/weak
  const topicStats: Record<string, { total: number; correct: number }> = {};
  const allAttempts = await db.attempt.findMany({
    where: { profileId: profile.id },
    include: { question: { select: { topic: true } } },
  });
  for (const a of allAttempts) {
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
