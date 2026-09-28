import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/revision — real spaced-repetition queue
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ items: [] });

  const items = await db.revisionItem.findMany({
    where: { profileId: profile.id },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      topic: r.topic,
      subject: r.subject,
      dueDate: r.dueDate.toISOString(),
      due: r.dueDate <= now ? "Today" : "Upcoming",
      interval: r.interval,
      strength: r.strength,
      lastReview: r.lastReview?.toISOString() ?? null,
    })),
  });
}

// POST /api/revision — review an item (strengthens it)
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });
  const { id } = await req.json();

  const item = await db.revisionItem.findUnique({ where: { id } });
  if (!item || item.profileId !== profile.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const newStrength = Math.min(100, item.strength + 25);
  const newInterval = newStrength >= 80 ? 21 : newStrength >= 50 ? 7 : 3;
  const due = new Date();
  due.setDate(due.getDate() + newInterval);

  const updated = await db.revisionItem.update({
    where: { id },
    data: { strength: newStrength, interval: newInterval, dueDate: due, lastReview: new Date() },
  });
  return NextResponse.json({ item: updated });
}
