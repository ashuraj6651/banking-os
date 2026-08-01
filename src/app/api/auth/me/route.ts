import { NextResponse } from "next/server";
import { getAccount } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/auth/me — current account + whether a profile exists
export async function GET() {
  const account = await getAccount();
  if (!account) {
    return NextResponse.json({ account: null });
  }
  const profile = await db.profile.findUnique({ where: { accountId: account.id } });
  return NextResponse.json({
    account: { id: account.id, email: account.email, name: account.name },
    hasProfile: !!profile,
  });
}
