import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";
import { getAvatar } from "@/lib/avatars";
import { MAX_COINS } from "@/lib/coins";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  let body: { avatarId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof body.avatarId !== "string") {
    return NextResponse.json({ error: "avatarId is required" }, { status: 400 });
  }

  const avatar = getAvatar(body.avatarId);
  if (!avatar) return NextResponse.json({ error: "Avatar not found" }, { status: 404 });

  const ownership = await db.avatarUnlock.findUnique({
    where: { profileId_avatarId: { profileId: profile.id, avatarId: avatar.id } },
  });
  if (!ownership) {
    return NextResponse.json({ error: "Unlock this avatar before selecting it" }, { status: 403 });
  }

  const updated = await db.profile.update({
    where: { id: profile.id },
    data: { avatarUrl: avatar.url },
  });
  return NextResponse.json({
    profile: { ...updated, coins: Math.min(MAX_COINS, Math.max(0, updated.coins)) },
    selectedAvatarId: avatar.id,
  });
}
