import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/profile — return the single local profile (or null)
export async function GET() {
  const profile = await db.profile.findFirst({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ profile });
}
