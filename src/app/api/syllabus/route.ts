import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/syllabus — returns { subject, topic, checked }[] for this profile
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ progress: [] });

  const rows = await db.syllabusProgress.findMany({
    where: { profileId: profile.id },
    select: { subject: true, topic: true, checked: true, checkedAt: true },
  });

  return NextResponse.json({
    progress: rows.map((r) => ({
      ...r,
      checkedAt: r.checkedAt?.toISOString() ?? null,
    })),
  });
}

// PATCH /api/syllabus — toggle a topic's checked state
// body: { subject, topic }
export async function PATCH(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const { subject, topic } = await req.json();
  if (!subject || !topic) {
    return NextResponse.json({ error: "subject and topic required" }, { status: 400 });
  }

  const existing = await db.syllabusProgress.findUnique({
    where: {
      profileId_subject_topic: { profileId: profile.id, subject, topic },
    },
  });

  if (!existing) {
    // create as checked
    const created = await db.syllabusProgress.create({
      data: { subject, topic, checked: true, checkedAt: new Date(), profileId: profile.id },
    });
    return NextResponse.json({ item: created });
  }

  const updated = await db.syllabusProgress.update({
    where: { id: existing.id },
    data: {
      checked: !existing.checked,
      checkedAt: !existing.checked ? new Date() : null,
    },
  });
  return NextResponse.json({ item: updated });
}
