import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getProfile,
  applyAttemptRewards,
  checkAchievements,
} from "@/lib/metrics";

export const runtime = "nodejs";

// POST /api/attempts
// body: { questionId, selected, context, timeTakenSec }
// Logs an attempt + creates an error entry if wrong + awards XP
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const { questionId, selected, context = "practice", timeTakenSec = 0 } = await req.json();
  const question = await db.question.findUnique({ where: { id: questionId } });
  if (!question) return NextResponse.json({ error: "question not found" }, { status: 404 });

  const correct = selected === question.answer;

  const attempt = await db.attempt.create({
    data: {
      questionId,
      selected: selected ?? null,
      correct,
      context,
      timeTakenSec,
      profileId: profile.id,
    },
  });

  // create error entry on wrong answer
  if (!correct) {
    // classify reason heuristically
    let reason = "Concept";
    if (timeTakenSec > 0 && timeTakenSec < 15) reason = "Guess";
    else if (timeTakenSec > 60) reason = "Time";
    else reason = "Concept";

    const due = new Date();
    due.setDate(due.getDate() + 1);

    // These two lookups don't depend on each other — run together
    // instead of one after another.
    const [existing, existingRev] = await Promise.all([
      db.errorEntry.findFirst({
        where: { questionId, profileId: profile.id, reviewed: false },
      }),
      db.revisionItem.findFirst({
        where: { topic: question.topic, profileId: profile.id },
      }),
    ]);

    const writes: Promise<unknown>[] = [];

    // avoid duplicate error entries for the same question if unreviewed
    if (!existing) {
      writes.push(
        db.errorEntry.create({
          data: { questionId, reason, profileId: profile.id },
        })
      );
    }

    // create / refresh a revision item for the topic
    if (existingRev) {
      writes.push(
        db.revisionItem.update({
          where: { id: existingRev.id },
          data: {
            strength: Math.max(0, existingRev.strength - 20),
            interval: 1,
            dueDate: due,
          },
        })
      );
    } else {
      writes.push(
        db.revisionItem.create({
          data: {
            topic: question.topic,
            subject: question.subject,
            dueDate: due,
            interval: 1,
            strength: 0,
            profileId: profile.id,
          },
        })
      );
    }

    await Promise.all(writes);
  } else {
    // strengthen the revision item if it exists
    const existingRev = await db.revisionItem.findFirst({
      where: { topic: question.topic, profileId: profile.id },
    });
    if (existingRev) {
      const newStrength = Math.min(100, existingRev.strength + 15);
      const newInterval = newStrength >= 80 ? 14 : newStrength >= 50 ? 7 : 3;
      const due = new Date();
      due.setDate(due.getDate() + newInterval);
      await db.revisionItem.update({
        where: { id: existingRev.id },
        data: { strength: newStrength, interval: newInterval, dueDate: due, lastReview: new Date() },
      });
    }
  }

  // XP + streak (combined into one profile fetch + one profile update
  // instead of the old 6 separate DB round trips)
  const updatedProfile = await applyAttemptRewards(profile.id, correct);
  await checkAchievements(profile.id, updatedProfile);

  return NextResponse.json({ attempt, correct, answer: question.answer, explanation: question.explanation });
}