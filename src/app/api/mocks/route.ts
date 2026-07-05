import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile, awardXp, checkAchievements } from "@/lib/metrics";

export const runtime = "nodejs";

// POST /api/mocks — start or complete a mock test
// { action: "start", title, durationSec } | { action: "complete", mockId, score }
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const body = await req.json();
  const { action } = body;

  if (action === "start") {
    const { title, durationSec } = body;
    const mock = await db.mockTest.create({
      data: { title, durationSec, profileId: profile.id },
    });
    return NextResponse.json({ mock });
  }

  if (action === "complete") {
    const { mockId, score } = body;
    const mock = await db.mockTest.findUnique({ where: { id: mockId } });
    if (!mock || mock.profileId !== profile.id) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const updated = await db.mockTest.update({
      where: { id: mockId },
      data: { status: "completed", score },
    });
    await awardXp(profile.id, 100);
    await checkAchievements(profile.id);
    return NextResponse.json({ mock: updated });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}

// GET /api/mocks — list completed mocks
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ mocks: [] });
  const mocks = await db.mockTest.findMany({
    where: { profileId: profile.id },
    orderBy: { startedAt: "desc" },
  });
  return NextResponse.json({ mocks });
}
