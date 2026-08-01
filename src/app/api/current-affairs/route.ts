import { NextRequest, NextResponse } from "next/server";
import { generateText, hasAnyAIProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";
export const maxDuration = 60;

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const hour = 1000 * 60 * 60;
  const day = 1000 * 60 * 60 * 24;
  const hours = Math.floor(diff / hour);
  const days = Math.floor(diff / day);
  if (days === 0 && hours === 0) return "Just now";
  if (days === 0) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

// GET /api/current-affairs
export async function GET() {
  const items = await db.currentAffair.findMany({
    orderBy: { date: "desc" },
    take: 50,
  });
  return NextResponse.json({
    items: items.map((c) => ({
      ...c,
      date: c.date.toISOString(),
      timeLabel: timeAgo(c.date),
    })),
  });
}

// POST /api/current-affairs — refresh & generate new current affairs via AI
export async function POST(req: NextRequest) {
  try {
    if (!hasAnyAIProvider()) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    const profile = await getProfile();
    const userName = profile?.name || "Student";

    const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const prompt = `You are a current affairs curator for BankOS, a banking exam preparation platform.

Today's date for reference: ${today}

Generate 8 fresh, real-world current affairs items relevant to banking exams (SBI PO, IBPS PO, RBI Grade B).

Categories to cover (at least 1-2 per category):
- RBI (monetary policy, rates, regulations)
- Economy (GDP, inflation, fiscal policy, trade)
- Banking (credit growth, digital banking, NPAs, reforms)
- Schemes (government schemes related to finance/banking)

Requirements:
- Each item should have a tag (one of: RBI, Economy, Banking, Schemes)
- Title should be concise and news-headline style
- Summary should be 1-2 informative sentences
- Must be realistic and based on actual recent events/trends in Indian banking

Return ONLY valid JSON array with no markdown, no code fences. Format:
[{"tag":"RBI","title":"headline here","summary":"1-2 sentence summary here"}]

Generate now:`;

    let text = (await generateText(prompt)).trim();
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();

    let parsed: { tag: string; title: string; summary: string }[] = [];
    try {
      parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) parsed = [];
    } catch {
      console.error("Failed to parse current affairs JSON");
    }

    // Save valid items to DB
    const newItems: Array<{ id: string; tag: string; title: string; summary: string; date: string; timeLabel: string }> = [];
    for (const item of parsed) {
      if (item.tag && item.title && item.summary) {
        const validTags = ["RBI", "Economy", "Banking", "Schemes"];
        const tag = validTags.includes(item.tag) ? item.tag : "Economy";
        const created = await db.currentAffair.create({
          data: {
            tag,
            title: item.title,
            summary: item.summary,
            date: new Date(),
          },
        });
        newItems.push({
          ...created,
          date: created.date.toISOString(),
          timeLabel: "Just now",
        });
      }
    }

    // Also generate questions from the new current affairs
    if (newItems.length > 0) {
      try {
        const topics = newItems.map(i => `${i.tag}: ${i.title} - ${i.summary}`).join("\n");
        const qPrompt = `Based on these current affairs, generate 5 multiple-choice questions for banking exam preparation.

Current affairs:
${topics}

Return ONLY valid JSON array with no markdown, no code fences. Format:
[{"text":"question","options":["A","B","C","D"],"answer":0,"explanation":"explanation","topic":"topic name"}]

Generate now:`;

        let qText = (await generateText(qPrompt)).trim();
        if (qText.startsWith("```json")) qText = qText.slice(7);
        if (qText.startsWith("```")) qText = qText.slice(3);
        if (qText.endsWith("```")) qText = qText.slice(0, -3);
        qText = qText.trim();

        const questions = JSON.parse(qText);
        if (Array.isArray(questions)) {
          for (const q of questions) {
            if (q.text && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === "number") {
              await db.question.create({
                data: {
                  subject: "Current Affairs",
                  topic: q.topic || "Current Affairs",
                  difficulty: "Medium",
                  text: q.text,
                  options: JSON.stringify(q.options),
                  answer: q.answer,
                  explanation: q.explanation || "",
                },
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to generate current affairs questions:", err);
      }
    }

    return NextResponse.json({
      success: true,
      newCount: newItems.length,
      items: newItems,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}