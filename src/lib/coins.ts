import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const MAX_COINS = 100_000;

export const COIN_REWARDS = {
  CORRECT_ANSWER: 5,
  WRONG_ANSWER: 1,
} as const;

export type CoinAwardResult = {
  balance: number;
  awarded: number;
  alreadyAwarded: boolean;
};

function prismaCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code);
  }
  return undefined;
}

/** Add a server-decided reward once, clamped to the hard balance ceiling. */
export async function addCoins(
  profileId: string,
  amount: number,
  eventKey: string,
): Promise<CoinAwardResult> {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("Coin reward must be a non-negative integer");
  }
  if (!eventKey.trim()) throw new Error("Coin reward event key is required");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(async (tx) => {
        const existing = await tx.coinReward.findUnique({
          where: { profileId_eventKey: { profileId, eventKey } },
        });
        const profile = await tx.profile.findUnique({
          where: { id: profileId },
          select: { coins: true },
        });
        if (!profile) throw new Error("Profile not found");

        const balance = Math.min(MAX_COINS, Math.max(0, profile.coins));
        if (existing) {
          return { balance, awarded: 0, alreadyAwarded: true };
        }

        const awarded = Math.min(amount, MAX_COINS - balance);
        await tx.coinReward.create({
          data: { profileId, eventKey, amount: awarded },
        });
        const updated = await tx.profile.update({
          where: { id: profileId },
          data: { coins: balance + awarded },
          select: { coins: true },
        });
        return { balance: updated.coins, awarded, alreadyAwarded: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      const code = prismaCode(error);
      if (code === "P2034" && attempt < 2) continue;
      if (code === "P2002") {
        const [reward, profile] = await Promise.all([
          db.coinReward.findUnique({ where: { profileId_eventKey: { profileId, eventKey } } }),
          db.profile.findUnique({ where: { id: profileId }, select: { coins: true } }),
        ]);
        if (reward && profile) {
          return { balance: Math.min(MAX_COINS, profile.coins), awarded: 0, alreadyAwarded: true };
        }
        if (attempt < 2) continue;
      }
      throw error;
    }
  }

  throw new Error("Could not safely apply coin reward; please retry");
}
