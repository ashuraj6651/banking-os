import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureTodayMissions, getProfile, generateTodayMissions } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/missions — today's missions for the profile
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ missions: [] });
  const missions = await ensureTodayMissions(profile.id);
  return NextResponse.json({ missions });
}

// POST /api/missions — regenerate today's missions (force refresh)
export async function POST() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  // Delete existing missions for today
  await db.mission.deleteMany({
    where: {
      profileId: profile.id,
      date: { gte: startOfDay, lt: endOfDay },
    },
  });

  // Generate fresh missions
  const generated = generateTodayMissions(profile);
  const created: Awaited<ReturnType<typeof db.mission.create>>[] = [];
  for (let i = 0; i < generated.length; i++) {
    const m = generated[i];
    created.push(
      await db.mission.create({
        data: {
          date: startOfDay,
          title: m.title,
          type: m.type,
          duration: m.duration,
          order: i,
          profileId: profile.id,
        },
      })
    );
  }

  return NextResponse.json({ missions: created });
}