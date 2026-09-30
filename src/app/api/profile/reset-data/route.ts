import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

// Delete this profile's learning history and wallet while preserving its login.
export async function POST() {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

    await db.$transaction([
      db.attempt.deleteMany({ where: { profileId: profile.id } }),
      db.errorEntry.deleteMany({ where: { profileId: profile.id } }),
      db.mission.deleteMany({ where: { profileId: profile.id } }),
      db.studySession.deleteMany({ where: { profileId: profile.id } }),
      db.mockTest.deleteMany({ where: { profileId: profile.id } }),
      db.revisionItem.deleteMany({ where: { profileId: profile.id } }),
      db.achievement.deleteMany({ where: { profileId: profile.id } }),
      db.syllabusProgress.deleteMany({ where: { profileId: profile.id } }),
      db.plannerTask.deleteMany({ where: { profileId: profile.id } }),
      db.plannerNote.deleteMany({ where: { profileId: profile.id } }),
      db.coachMessage.deleteMany({ where: { profileId: profile.id } }),
      db.avatarUnlock.deleteMany({ where: { profileId: profile.id } }),
      db.coinReward.deleteMany({ where: { profileId: profile.id } }),
      db.profile.update({
        where: { id: profile.id },
        data: {
          streak: 0,
          lastActiveDate: null,
          level: 1,
          xp: 0,
          coins: 0,
          avatarUrl: null,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not clear profile data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
