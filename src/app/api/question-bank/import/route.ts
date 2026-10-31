import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/metrics";
import { insertNewQuestions } from "@/lib/question-bank";
import { parseQuestionUpload } from "@/lib/question-bank/import";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_CHARS = 3_000_000;

// POST /api/question-bank/import   body: { content: string, format?: "json" | "csv" }
// Validates the uploaded list, skips questions already in the bank (matched by text),
// and adds the rest. Nothing existing is modified or deleted.
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { content?: unknown; format?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content : "";
  if (!content.trim()) return NextResponse.json({ error: "Paste or upload some questions first." }, { status: 400 });
  if (content.length > MAX_CHARS) return NextResponse.json({ error: "File is too large (max ~3 MB)." }, { status: 413 });

  const format = body?.format === "json" || body?.format === "csv" ? body.format : undefined;
  const parsed = parseQuestionUpload(content, format);

  if (parsed.questions.length === 0) {
    return NextResponse.json(
      { error: parsed.errors[0]?.message ?? "No valid questions found.", errors: parsed.errors.slice(0, 25), total: parsed.total },
      { status: 400 }
    );
  }

  const { added, skipped } = await insertNewQuestions(parsed.questions);
  return NextResponse.json({
    total: parsed.total,
    added,
    duplicates: skipped,
    invalid: parsed.errors.length,
    errors: parsed.errors.slice(0, 25),
  });
}
