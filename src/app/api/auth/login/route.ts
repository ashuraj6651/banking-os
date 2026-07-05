import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSessionRecord, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/auth/login { email, password }
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    const account = await db.account.findUnique({ where: { email: email.toLowerCase() } });
    if (!account || !verifyPassword(password, account.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { token, expiresAt } = await createSessionRecord(account.id);
    const res = NextResponse.json({
      account: { id: account.id, email: account.email, name: account.name },
    });
    setSessionCookie(res, token, expiresAt);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
