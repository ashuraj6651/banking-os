import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

function dayStart(input?: string | null) {
  const d = input ? new Date(input) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// PUT /api/planner/note — upsert the quick note for a given date
export async function PUT(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const { date, content } = await req.json();
  const start = dayStart(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const existing = await db.plannerNote.findFirst({
    where: { profileId: profile.id, date: { gte: start, lt: end } },
  });

  const note = existing
    ? await db.plannerNote.update({
        where: { id: existing.id },
        data: { content: content ?? "" },
      })
    : await db.plannerNote.create({
        data: { date: start, content: content ?? "", profileId: profile.id },
      });

  return NextResponse.json({ note });
}
