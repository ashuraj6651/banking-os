import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSessionRecord, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/auth/register { email, password, name }
export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "email, password and name are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await db.account.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const account = await db.account.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        name,
      },
    });

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
