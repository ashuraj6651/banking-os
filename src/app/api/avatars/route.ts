import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";
import { AVATAR_CATALOG, getAvatar } from "@/lib/avatars";
import { MAX_COINS } from "@/lib/coins";

export const runtime = "nodejs";

async function ensureLegacyOwnership(profileId: string, avatarUrl: string | null) {
  const legacyAvatar = AVATAR_CATALOG.find((avatar) => avatar.url === avatarUrl);
  await db.avatarUnlock.createMany({
    data: [
      { profileId, avatarId: "aster" },
      ...(legacyAvatar && legacyAvatar.id !== "aster"
        ? [{ profileId, avatarId: legacyAvatar.id }]
        : []),
    ],
    skipDuplicates: true,
  });
}

export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  await ensureLegacyOwnership(profile.id, profile.avatarUrl);
  const unlocked = await db.avatarUnlock.findMany({
    where: { profileId: profile.id },
    select: { avatarId: true },
  });
  const unlockedIds = new Set(unlocked.map((item) => item.avatarId));

  return NextResponse.json({
    coins: Math.min(MAX_COINS, Math.max(0, profile.coins)),
    selectedAvatarId: AVATAR_CATALOG.find((avatar) => avatar.url === profile.avatarUrl)?.id ?? null,
    avatars: AVATAR_CATALOG.map((avatar) => ({
      ...avatar,
      unlocked: unlockedIds.has(avatar.id),
      selected: avatar.url === profile.avatarUrl,
    })),
  });
}

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

  await ensureLegacyOwnership(profile.id, profile.avatarUrl);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await db.$transaction(async (tx) => {
        const owned = await tx.avatarUnlock.findUnique({
          where: { profileId_avatarId: { profileId: profile.id, avatarId: avatar.id } },
        });
        const current = await tx.profile.findUnique({
          where: { id: profile.id },
          select: { coins: true },
        });
        if (!current) throw new Error("Profile not found");
        const balance = Math.min(MAX_COINS, Math.max(0, current.coins));
        if (owned) return { balance, unlocked: true, alreadyOwned: true };
        if (balance < avatar.price) {
          return { balance, unlocked: false, alreadyOwned: false };
        }

        const updated = await tx.profile.update({
          where: { id: profile.id },
          data: { coins: balance - avatar.price },
          select: { coins: true },
        });
        await tx.avatarUnlock.create({
          data: { profileId: profile.id, avatarId: avatar.id },
        });
        return { balance: updated.coins, unlocked: true, alreadyOwned: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      if (!result.unlocked) {
        return NextResponse.json(
          { error: "Not enough coins", coins: result.balance, required: avatar.price },
          { status: 400 },
        );
      }
      return NextResponse.json({
        coins: result.balance,
        avatar: { ...avatar, unlocked: true },
        alreadyOwned: result.alreadyOwned,
      });
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
      if ((code === "P2034" || code === "P2002") && attempt < 2) continue;
      console.error("Avatar unlock failed", error);
      return NextResponse.json({ error: "Could not unlock avatar. Please retry." }, { status: 409 });
    }
  }

  return NextResponse.json({ error: "Could not unlock avatar. Please retry." }, { status: 409 });
}
