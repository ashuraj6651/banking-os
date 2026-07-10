import { NextRequest, NextResponse } from "next/server";
import { generateChatReply, hasAnyAIProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `
You are Mentor, the AI Coach inside BankOS.
You help banking exam aspirants with practical, concise and helpful advice.
Reply naturally based on the user's message.

Formatting rules (always follow):
- Use short paragraphs (1-3 sentences each).
- Use markdown bullet points or numbered lists for anything with 3+ items — never cram a list into one paragraph.
- Use **bold** only for genuinely important words, not entire sentences.
- Use a markdown heading (## or ###) only when the reply covers multiple distinct sections.
- Keep responses tight and skimmable — avoid long walls of text.
`;

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const DEFAULT_GREETING = `${getGreeting()}, Ashu. I'm your Mentor. How can I help you today? You can ask me for study tips, mock test advice, or a focused recovery plan based on your recent performance.`;

// GET /api/coach — return saved chat history for the logged-in profile.
// If there's no history yet, seed it with the default greeting so the
// UI always has something to render (and persists that greeting too).
export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({
      messages: [{ role: "assistant", content: DEFAULT_GREETING }],
    });
  }

  let history = await db.coachMessage.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "asc" },
  });

  if (history.length === 0) {
    const seeded = await db.coachMessage.create({
      data: { profileId: profile.id, role: "assistant", content: DEFAULT_GREETING },
    });
    history = [seeded];
  }

  return NextResponse.json({
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });
}

// POST /api/coach — send a new user message, get + persist the AI reply.
// Body: { messages: {role, content}[] } — the full running conversation
// (same shape as before, for the AI call), but only the LAST user message
// in that array is actually saved (earlier turns are already persisted).
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    console.log("MESSAGES RECEIVED:");
    console.log(messages);

    if (!hasAnyAIProvider()) {
      return NextResponse.json(
        { error: "No AI provider configured (set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY)" },
        { status: 500 }
      );
    }

    const profile = await getProfile();
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");

    if (profile && lastUserMessage) {
      await db.coachMessage.create({
        data: { profileId: profile.id, role: "user", content: lastUserMessage.content },
      });
    }

    const content = await generateChatReply(SYSTEM_PROMPT, messages);

    if (profile) {
      await db.coachMessage.create({
        data: { profileId: profile.id, role: "assistant", content },
      });
    }

    return NextResponse.json({ content });
  } catch (e) {
    console.error("FULL ERROR:", e);

    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/coach — clear chat history for the logged-in profile.
export async function DELETE() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ ok: true });
  }
  await db.coachMessage.deleteMany({ where: { profileId: profile.id } });
  return NextResponse.json({ ok: true });
}
