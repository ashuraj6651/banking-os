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
  const [attempts, correct, sessions, mocks, achievements, readiness, sessionsAll] =
    await Promise.all([
      db.attempt.count({ where: { profileId: profile.id } }),
      db.attempt.count({ where: { profileId: profile.id, correct: true } }),
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