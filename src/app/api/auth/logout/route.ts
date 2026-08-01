import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/auth/logout
export async function POST() {
  // delete the session from DB
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  // clear the cookie on the response
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
