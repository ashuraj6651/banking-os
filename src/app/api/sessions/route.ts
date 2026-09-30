import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile, awardXp, touchStreak } from "@/lib/metrics";

export const runtime = "nodejs";

// POST /api/sessions — start or end a study session
// body: { action: "start" | "end", sessionId?, questionsAttempted?, correctCount?, durationSec? }
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const body = await req.json();
  const { action } = body;

  if (action === "start") {
    const session = await db.studySession.create({
      data: { profileId: profile.id },
    });
    return NextResponse.json({ session });
  }

  if (action === "end") {
    const { sessionId } = body;
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    const existingSession = await db.studySession.findFirst({
      where: { id: sessionId, profileId: profile.id },
    });
    if (!existingSession) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }
    if (existingSession.endedAt) {
      return NextResponse.json({ session: existingSession, alreadyCompleted: true });
    }

    const endedAt = new Date();
    const attempts = await db.attempt.findMany({
      where: {
        profileId: profile.id,
        date: { gte: existingSession.startedAt, lte: endedAt },
      },
      select: { correct: true },
    });
    const durationSec = Math.min(
      12 * 60 * 60,
      Math.max(0, Math.floor((endedAt.getTime() - existingSession.startedAt.getTime()) / 1000)),
    );
    const completion = await db.studySession.updateMany({
      where: { id: sessionId, profileId: profile.id, endedAt: null },
      data: {
        endedAt,
        durationSec,
        questionsAttempted: attempts.length,
        correctCount: attempts.filter((attempt) => attempt.correct).length,
      },
    });
    if (completion.count === 0) {
      const session = await db.studySession.findUnique({ where: { id: sessionId } });
      return NextResponse.json({ session, alreadyCompleted: true });
    }

    const session = await db.studySession.findUniqueOrThrow({ where: { id: sessionId } });
    const reward = await awardXp(
      profile.id,
      session.questionsAttempted * 5 + Math.floor(session.durationSec / 60) * 2,
      `study-session:${sessionId}`,
    );
    await touchStreak(profile.id);
    return NextResponse.json({ session, coinsAwarded: reward?.coinsAwarded ?? 0 });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
