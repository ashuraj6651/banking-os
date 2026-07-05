import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile, ensureTodayMissions } from "@/lib/metrics";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/backup/import — restore from a backup JSON
// Replaces all existing data for this profile with the backup contents.
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "no profile" }, { status: 404 });
    }

    const backup = await req.json();
    if (!backup || !backup.profile || backup.version !== 1) {
      return NextResponse.json({ error: "Invalid backup file" }, { status: 400 });
    }

    // wipe existing data for this profile
    await Promise.all([
      db.mission.deleteMany({ where: { profileId: profile.id } }),
      db.attempt.deleteMany({ where: { profileId: profile.id } }),
      db.studySession.deleteMany({ where: { profileId: profile.id } }),
      db.mockTest.deleteMany({ where: { profileId: profile.id } }),
      db.errorEntry.deleteMany({ where: { profileId: profile.id } }),
      db.revisionItem.deleteMany({ where: { profileId: profile.id } }),
      db.achievement.deleteMany({ where: { profileId: profile.id } }),
      db.syllabusProgress.deleteMany({ where: { profileId: profile.id } }),
    ]);

    // restore profile fields
    await db.profile.update({
      where: { id: profile.id },
      data: {
        name: backup.profile.name,
        exam: backup.profile.exam,
        targetDate: new Date(backup.profile.targetDate),
        studyHoursPerDay: backup.profile.studyHoursPerDay ?? 4,
        weakSubjects: backup.profile.weakSubjects ?? "",
        streak: backup.profile.streak ?? 0,
        level: backup.profile.level ?? 1,
        xp: backup.profile.xp ?? 0,
        coins: backup.profile.coins ?? 0,
        roadmap: backup.profile.roadmap ?? "",
      },
    });

    // restore child records
    if (Array.isArray(backup.missions)) {
      for (const m of backup.missions) {
        await db.mission.create({
          data: {
            date: new Date(m.date),
            title: m.title,
            type: m.type,
            duration: m.duration,
            done: m.done,
            order: m.order ?? 0,
            profileId: profile.id,
          },
        });
      }
    }
    if (Array.isArray(backup.attempts)) {
      for (const a of backup.attempts) {
        await db.attempt.create({
          data: {
            questionId: a.questionId,
            selected: a.selected,
            correct: a.correct,
            timeTakenSec: a.timeTakenSec ?? 0,
            context: a.context ?? "practice",
            date: new Date(a.date),
            profileId: profile.id,
          },
        });
      }
    }
    if (Array.isArray(backup.sessions)) {
      for (const s of backup.sessions) {
        await db.studySession.create({
          data: {
            startedAt: new Date(s.startedAt),
            durationSec: s.durationSec ?? 0,
            questionsAttempted: s.questionsAttempted ?? 0,
            correctCount: s.correctCount ?? 0,
            profileId: profile.id,
          },
        });
      }
    }
    if (Array.isArray(backup.mocks)) {
      for (const m of backup.mocks) {
        await db.mockTest.create({
          data: {
            title: m.title,
            startedAt: new Date(m.startedAt),
            durationSec: m.durationSec ?? 0,
            status: m.status ?? "incomplete",
            score: m.score ?? null,
            profileId: profile.id,
          },
        });
      }
    }
    if (Array.isArray(backup.errors)) {
      for (const e of backup.errors) {
        await db.errorEntry.create({
          data: {
            questionId: e.questionId,
            reason: e.reason,
            date: new Date(e.date),
            reviewed: e.reviewed ?? false,
            profileId: profile.id,
          },
        });
      }
    }
    if (Array.isArray(backup.revisions)) {
      for (const r of backup.revisions) {
        await db.revisionItem.create({
          data: {
            topic: r.topic,
            subject: r.subject,
            dueDate: new Date(r.dueDate),
            interval: r.interval ?? 1,
            strength: r.strength ?? 0,
            lastReview: r.lastReview ? new Date(r.lastReview) : null,
            profileId: profile.id,
          },
        });
      }
    }
    if (Array.isArray(backup.achievements)) {
      for (const a of backup.achievements) {
        await db.achievement.create({
          data: { key: a.key, profileId: profile.id },
        });
      }
    }
    if (Array.isArray(backup.syllabus)) {
      for (const s of backup.syllabus) {
        await db.syllabusProgress.create({
          data: {
            subject: s.subject,
            topic: s.topic,
            checked: s.checked ?? false,
            checkedAt: s.checkedAt ? new Date(s.checkedAt) : null,
            profileId: profile.id,
          },
        });
      }
    }

    // ensure today's missions exist for the restored profile
    await ensureTodayMissions(profile.id);

    return NextResponse.json({ ok: true, restored: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
