import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/backup/export — download all of the user's data as JSON
export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "no profile" }, { status: 404 });
  }

  const [missions, attempts, sessions, mocks, errors, revisions, achievements, syllabus] =
    await Promise.all([
      db.mission.findMany({ where: { profileId: profile.id } }),
      db.attempt.findMany({ where: { profileId: profile.id } }),
      db.studySession.findMany({ where: { profileId: profile.id } }),
      db.mockTest.findMany({ where: { profileId: profile.id } }),
      db.errorEntry.findMany({ where: { profileId: profile.id } }),
      db.revisionItem.findMany({ where: { profileId: profile.id } }),
      db.achievement.findMany({ where: { profileId: profile.id } }),
      db.syllabusProgress.findMany({ where: { profileId: profile.id } }),
    ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      name: profile.name,
      exam: profile.exam,
      targetDate: profile.targetDate.toISOString(),
      studyHoursPerDay: profile.studyHoursPerDay,
      weakSubjects: profile.weakSubjects,
      streak: profile.streak,
      level: profile.level,
      xp: profile.xp,
      coins: profile.coins,
      roadmap: profile.roadmap,
    },
    missions: missions.map((m) => ({
      date: m.date.toISOString(),
      title: m.title,
      type: m.type,
      duration: m.duration,
      done: m.done,
      order: m.order,
    })),
    attempts: attempts.map((a) => ({
      questionId: a.questionId,
      selected: a.selected,
      correct: a.correct,
      timeTakenSec: a.timeTakenSec,
      context: a.context,
      date: a.date.toISOString(),
    })),
    sessions: sessions.map((s) => ({
      startedAt: s.startedAt.toISOString(),
      durationSec: s.durationSec,
      questionsAttempted: s.questionsAttempted,
      correctCount: s.correctCount,
    })),
    mocks: mocks.map((m) => ({
      title: m.title,
      startedAt: m.startedAt.toISOString(),
      durationSec: m.durationSec,
      status: m.status,
      score: m.score,
    })),
    errors: errors.map((e) => ({
      questionId: e.questionId,
      reason: e.reason,
      date: e.date.toISOString(),
      reviewed: e.reviewed,
    })),
    revisions: revisions.map((r) => ({
      topic: r.topic,
      subject: r.subject,
      dueDate: r.dueDate.toISOString(),
      interval: r.interval,
      strength: r.strength,
      lastReview: r.lastReview?.toISOString() ?? null,
    })),
    achievements: achievements.map((a) => ({ key: a.key })),
    syllabus: syllabus.map((s) => ({
      subject: s.subject,
      topic: s.topic,
      checked: s.checked,
      checkedAt: s.checkedAt?.toISOString() ?? null,
    })),
  };

  return NextResponse.json(backup);
}
