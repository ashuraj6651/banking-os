import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getProfile,
  awardXp,
  checkAchievements,
  touchStreak,
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

    // avoid duplicate error entries for the same question if unreviewed
    const existing = await db.errorEntry.findFirst({
      where: { questionId, profileId: profile.id, reviewed: false },
    });
    if (!existing) {
      await db.errorEntry.create({
        data: { questionId, reason, profileId: profile.id },
      });
    }

    // create / refresh a revision item for the topic
    const due = new Date();
    due.setDate(due.getDate() + 1);
    const existingRev = await db.revisionItem.findFirst({
      where: { topic: question.topic, profileId: profile.id },
    });
    if (existingRev) {
      await db.revisionItem.update({
        where: { id: existingRev.id },
        data: {
          strength: Math.max(0, existingRev.strength - 20),
          interval: 1,
          dueDate: due,
        },
      });
    } else {
      await db.revisionItem.create({
        data: {
          topic: question.topic,
          subject: question.subject,
          dueDate: due,
          interval: 1,
          strength: 0,
          profileId: profile.id,
        },
      });
    }
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

  // XP
  await awardXp(profile.id, correct ? 10 : 3);
  await touchStreak(profile.id);
  await checkAchievements(profile.id);

  return NextResponse.json({ attempt, correct, answer: question.answer, explanation: question.explanation });
}
