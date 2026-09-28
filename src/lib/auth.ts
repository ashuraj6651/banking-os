// BankOS — authentication library
// Password hashing via Node crypto.scrypt (no external deps).
// Sessions stored in DB. Cookie set on NextResponse in route handlers.

import { db } from "./db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "bankos_session";
const SESSION_TTL_DAYS = 30;

/** Hash a password using scrypt with a per-password salt. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Verify a password against a stored `salt:hash` string. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  if (hashBuf.length !== testBuf.length) return false;
  return timingSafeEqual(hashBuf, testBuf);
}

/** Create a new session in the DB. Returns { token, expiresAt } — caller sets the cookie. */
export async function createSessionRecord(accountId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  await db.session.create({
    data: { token, accountId, expiresAt },
  });

  return { token, expiresAt };
}

/** Set the session cookie on a NextResponse object (for Route Handlers). */
export function setSessionCookie(
  res: NextResponse,
  token: string,
  expiresAt: Date
) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Clear the session cookie on a NextResponse object. */
export function clearSessionCookie(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE);
}

/** Get the current authenticated account, or null. */
export async function getAccount() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { account: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.account;
}

/** Require auth — returns account or throws a 401-friendly sentinel. */
export async function requireAccount() {
  const account = await getAccount();
  if (!account) throw new Error("UNAUTHORIZED");
  return account;
}
