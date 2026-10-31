import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";
import { ensureQuestionBank } from "@/lib/question-bank";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// GET /api/question-bank → size of the bank + how many questions this user hasn't seen yet
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  await ensureQuestionBank();

  const [all, attempted] = await Promise.all([
    db.question.findMany({ select: { id: true, subject: true } }),
    db.attempt.findMany({
      where: { profileId: profile.id },
      select: { questionId: true },
      distinct: ["questionId"],
    }),
  ]);
  const seen = new Set(attempted.map((a) => a.questionId));

  const bySubject = new Map<string, { total: number; fresh: number }>();
  let fresh = 0;
  for (const q of all) {
    const s = bySubject.get(q.subject) ?? { total: 0, fresh: 0 };
    s.total++;
    if (!seen.has(q.id)) {
      s.fresh++;
      fresh++;
    }
    bySubject.set(q.subject, s);
  }

  return NextResponse.json(
    {
      total: all.length,
      fresh,
      bySubject: [...bySubject.entries()]
        .map(([subject, v]) => ({ subject, ...v }))
        .sort((a, b) => b.total - a.total),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
