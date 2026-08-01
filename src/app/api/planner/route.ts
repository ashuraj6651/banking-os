import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

/** Normalize any date-ish input to midnight UTC of that calendar day. */
function dayStart(input?: string | null) {
  const d = input ? new Date(input) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// GET /api/planner?date=YYYY-MM-DD — tasks + quick note for that day
export async function GET(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ tasks: [], note: "" });

  const dateParam = req.nextUrl.searchParams.get("date");
  const start = dayStart(dateParam);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const [tasks, note] = await Promise.all([
    db.plannerTask.findMany({
      where: { profileId: profile.id, date: { gte: start, lt: end } },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    db.plannerNote.findFirst({
      where: { profileId: profile.id, date: { gte: start, lt: end } },
    }),
  ]);

  return NextResponse.json({ tasks, note: note?.content ?? "" });
}

// POST /api/planner — create a new task for a given date
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const body = await req.json();
  const {
    date,
    title,
    subject = "General",
    priority = "medium",
    estMinutes = 30,
    description = "",
  } = body ?? {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const start = dayStart(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const count = await db.plannerTask.count({
    where: { profileId: profile.id, date: { gte: start, lt: end } },
  });

  const task = await db.plannerTask.create({
    data: {
      date: start,
      title: title.trim(),
      subject,
      priority,
      estMinutes: Math.max(5, Math.min(600, Number(estMinutes) || 30)),
      description,
      order: count,
      profileId: profile.id,
    },
  });

  return NextResponse.json({ task });
}
