import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile, awardXp, checkAchievements } from "@/lib/metrics";

export const runtime = "nodejs";

// PATCH /api/missions/[id] — toggle done
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const mission = await db.mission.findUnique({ where: { id } });
  if (!mission || mission.profileId !== profile.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const updated = await db.mission.update({
    where: { id },
    data: { done: !mission.done },
  });

  if (updated.done) {
    await awardXp(profile.id, 50);
  }
  await checkAchievements(profile.id);

  return NextResponse.json({ mission: updated });
}
