import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile, computeReadiness } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/profile/stats — full profile with computed stats + achievements
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ empty: true });

  // None of these depend on each other — fetch them all together
  // instead of one after another (this is what was making the
  // dashboard slow to load).
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const istTodayStart = new Date(Date.UTC(
    Number(dateParts.year),
    Number(dateParts.month) - 1,
    Number(dateParts.day),
    -5,
    -30,
  ));
  const istTomorrowStart = new Date(istTodayStart.getTime() + 24 * 60 * 60 * 1000);

  const [attempts, correct, dailyAttempts, sessions, mocks, achievements, readiness, sessionsAll] =
    await Promise.all([
      db.attempt.count({ where: { profileId: profile.id } }),
      db.attempt.count({ where: { profileId: profile.id, correct: true } }),
      db.attempt.count({ where: { profileId: profile.id, date: { gte: istTodayStart, lt: istTomorrowStart } } }),
      db.studySession.count({ where: { profileId: profile.id } }),
      db.mockTest.count({ where: { profileId: profile.id, status: "completed" } }),
      db.achievement.findMany({ where: { profileId: profile.id } }),
      computeReadiness(profile.id),
      db.studySession.findMany({ where: { profileId: profile.id } }),
    ]);
  const heatmap: number[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = sessionsAll.filter((s) => s.startedAt >= d && s.startedAt < next).length;
    heatmap.push(count > 2 ? 4 : count > 1 ? 3 : count === 1 ? 2 : 0);
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil((profile.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return NextResponse.json({
    profile: {
      ...profile,
      targetDate: profile.targetDate.toISOString(),
      lastActiveDate: profile.lastActiveDate?.toISOString() ?? null,
      createdAt: profile.createdAt.toISOString(),
    },
    stats: {
      attempts,
      dailyAttempts,
      correct,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      sessions,
      mocks,
      daysRemaining,
      achievements: achievements.map((a) => a.key),
    },
    readiness,
    heatmap,
  });
}
