// BankOS — built-in question bank + loader.
// The built-in bank is code (deterministic), and `ensureQuestionBank()` inserts any
// question whose text isn't already in the database. It is idempotent, never deletes
// anything and never touches attempts, so it is safe to run on every server start.
import { db } from "@/lib/db";
import { BankQuestion } from "./core";
import { generateQuant } from "./gen-quant";
import { generateReasoning } from "./gen-reasoning";
import { ENGLISH_BANK } from "./english";
import { BANKING_BANK } from "./banking";
import { REASONING_BANK } from "./reasoning";

export const normText = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();

let cached: BankQuestion[] | null = null;
export function builtInBank(): BankQuestion[] {
  if (cached) return cached;
  const seen = new Set<string>();
  const all = [
    ...generateQuant(),
    ...generateReasoning(),
    ...REASONING_BANK,
    ...ENGLISH_BANK,
    ...BANKING_BANK,
  ].filter((q) => {
    const k = normText(q.text);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  cached = all;
  return all;
}

/** Insert questions whose text is not already stored. Returns how many were added. */
export async function insertNewQuestions(rows: BankQuestion[]): Promise<{ added: number; skipped: number }> {
  if (rows.length === 0) return { added: 0, skipped: 0 };
  const existing = await db.question.findMany({ select: { text: true } });
  const have = new Set(existing.map((e) => normText(e.text)));
  const fresh: BankQuestion[] = [];
  for (const q of rows) {
    const k = normText(q.text);
    if (have.has(k)) continue;
    have.add(k);
    fresh.push(q);
  }
  const CHUNK = 200;
  for (let i = 0; i < fresh.length; i += CHUNK) {
    await db.question.createMany({
      data: fresh.slice(i, i + CHUNK).map((q) => ({
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        text: q.text,
        options: JSON.stringify(q.options),
        answer: q.answer,
        explanation: q.explanation,
      })),
    });
  }
  return { added: fresh.length, skipped: rows.length - fresh.length };
}

let ensuring: Promise<void> | null = null;
/** Make sure the built-in bank is in the DB (runs once per server process). */
export function ensureQuestionBank(): Promise<void> {
  if (!ensuring) {
    ensuring = insertNewQuestions(builtInBank())
      .then(() => undefined)
      .catch((err) => {
        ensuring = null; // retry on next request
        console.error("ensureQuestionBank failed:", err);
      });
  }
  return ensuring;
}
