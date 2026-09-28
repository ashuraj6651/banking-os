import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/profile — return the authenticated account profile (or null)
export async function GET() {
  const profile = await getProfile();
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "no profile" }, { status: 404 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      data.name = body.name.trim();
    }
    if (typeof body.avatarUrl === "string") {
      data.avatarUrl = body.avatarUrl.trim() || null;
    }
    if (typeof body.exam === "string") {
      data.exam = body.exam.trim();
    }
    if (typeof body.goal === "string") {
      data.roadmap = body.goal.trim();
    }
    if (typeof body.roadmap === "string") {
      data.roadmap = body.roadmap.trim();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid profile fields provided" }, { status: 400 });
    }

    const updated = await db.profile.update({ where: { id: profile.id }, data });
    return NextResponse.json({ profile: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
