import { NextResponse } from "next/server";
import { getProfile, computeReadiness } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/readiness — computed from real attempts
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ empty: true });
  const readiness = await computeReadiness(profile.id);
  return NextResponse.json({ profile, readiness });
}
