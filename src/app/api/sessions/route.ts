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
    const { sessionId, questionsAttempted = 0, correctCount = 0, durationSec = 0 } = body;
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    const session = await db.studySession.update({
      where: { id: sessionId },
      data: { questionsAttempted, correctCount, durationSec },
    });
    await awardXp(profile.id, questionsAttempted * 5 + Math.floor(durationSec / 60) * 2);
    await touchStreak(profile.id);
    return NextResponse.json({ session });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
