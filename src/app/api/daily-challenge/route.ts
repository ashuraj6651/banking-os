import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";
import { ensureQuestionBank } from "@/lib/question-bank";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const DEFAULT_COUNT = 25;

function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Round-robin across subjects (random subject order) so every run is a mixed paper. */
function balancedPick<T extends { id: string; subject: string }>(rows: T[], count: number): T[] {
  const bySubject = new Map<string, T[]>();
  for (const row of shuffled(rows)) {
    const list = bySubject.get(row.subject) ?? [];
    list.push(row);
    bySubject.set(row.subject, list);
  }
  const order = shuffled([...bySubject.keys()]);
  const out: T[] = [];
  while (out.length < count && order.some((s) => (bySubject.get(s)?.length ?? 0) > 0)) {
    for (const s of order) {
      const next = bySubject.get(s)?.pop();
      if (next) out.push(next);
      if (out.length >= count) break;
    }
  }
  return out;
}

// POST /api/daily-challenge   body: { count?: number, exclude?: string[] }
// Returns a fresh set of questions on EVERY call: anything this user has already
// attempted (in any mode) or that the browser reports as recently served is skipped.
// Only when the unseen pool runs out are older questions recycled (oldest first).
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { count?: unknown; exclude?: unknown };
  const count = Math.max(5, Math.min(50, Number(body.count) || DEFAULT_COUNT));
  const exclude = new Set<string>(
    Array.isArray(body.exclude) ? body.exclude.filter((x): x is string => typeof x === "string").slice(0, 3000) : []
  );

  await ensureQuestionBank();

  const [all, attempts] = await Promise.all([
    db.question.findMany({ select: { id: true, subject: true } }),
    db.attempt.groupBy({
      by: ["questionId"],
      where: { profileId: profile.id },
      _max: { date: true },
    }),
  ]);

  const lastAttempt = new Map(attempts.map((a) => [a.questionId, a._max.date?.getTime() ?? 0]));
  const fresh = all.filter((q) => !lastAttempt.has(q.id) && !exclude.has(q.id));

  let picked = balancedPick(fresh, count);
  const freshUsed = picked.length;
  let recycled = false;

  if (picked.length < count) {
    recycled = true;
    const taken = new Set(picked.map((p) => p.id));
    const rest = shuffled(all.filter((q) => !taken.has(q.id)));
    // Oldest-seen first (bucketed by day so same-day ties stay random).
    const dayOf = (id: string) => Math.floor((lastAttempt.get(id) ?? 0) / 86_400_000);
    rest.sort((a, b) => dayOf(a.id) - dayOf(b.id));
    picked = [...picked, ...rest.slice(0, count - picked.length)];
  }

  const rows = await db.question.findMany({ where: { id: { in: picked.map((p) => p.id) } } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const questions = shuffled(picked)
    .map((p) => byId.get(p.id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({
      id: r.id,
      subject: r.subject,
      topic: r.topic,
      difficulty: r.difficulty,
      text: r.text,
      options: JSON.parse(r.options) as string[],
      answer: r.answer,
      explanation: r.explanation,
    }));

  return NextResponse.json(
    { questions, recycled, freshRemaining: Math.max(0, fresh.length - freshUsed) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
