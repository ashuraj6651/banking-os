import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/errors — real error notebook
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ errors: [] });

  const errors = await db.errorEntry.findMany({
    where: { profileId: profile.id },
    include: { question: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    errors: errors.map((e) => ({
      id: e.id,
      questionId: e.questionId,
      question: e.question.text,
      subject: e.question.subject,
      topic: e.question.topic,
      reason: e.reason,
      reviewed: e.reviewed,
      date: e.date.toISOString(),
      explanation: e.question.explanation,
    })),
  });
}

// PATCH /api/errors — mark reviewed
export async function PATCH(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });
  const { id } = await req.json();
  const entry = await db.errorEntry.findUnique({ where: { id } });
  if (!entry || entry.profileId !== profile.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const updated = await db.errorEntry.update({
    where: { id },
    data: { reviewed: !entry.reviewed },
  });
  return NextResponse.json({ entry: updated });
}
