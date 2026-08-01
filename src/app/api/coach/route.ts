import { NextRequest, NextResponse } from "next/server";
import { generateChatReply, hasAnyAIProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `
You are Mentor, the AI Coach inside BankOS.

Your purpose is to help banking exam aspirants prepare efficiently for exams such as SBI PO, IBPS PO, IBPS Clerk, RRB PO and similar competitive banking exams.

Guidelines:
- Give practical, concise and actionable advice.
- Explain concepts simply.
- Break large goals into achievable study plans.
- Motivate naturally without sounding robotic.
- Never invent user performance statistics.
- Never claim you analyzed data unless that data is explicitly provided.
- If analytics are unavailable, clearly say so instead of guessing.

Formatting:
- Use short paragraphs.
- Use markdown bullet points for lists.
- Use headings only when needed.
- Avoid long walls of text.
`;

function getDefaultGreeting(name?: string) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : "Good evening";

  return `${greeting}${name ? `, ${name}` : ""}. 👋

Welcome back to BankOS.

I'm your AI Mentor, here to help you prepare smarter—not just harder.

I can help you with:

• Quantitative Aptitude
• Reasoning
• English
• General Awareness
• Mock Test Analysis
• Daily Study Planning

What would you like to work on today?`;
}

// GET /api/coach — return saved chat history for the logged-in profile.
// If there's no history yet, seed it with the default greeting so the
// UI always has something to render (and persists that greeting too).
export async function GET() {
  const profile = await getProfile();
  const defaultGreeting = getDefaultGreeting(profile?.name);

  if (!profile) {
    return NextResponse.json({
      messages: [{ role: "assistant", content: defaultGreeting }],
    });
  }

  let history = await db.coachMessage.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "asc" },
  });

  if (history.length === 0) {
    const seeded = await db.coachMessage.create({
      data: { profileId: profile.id, role: "assistant", content: defaultGreeting },
    });
    history = [seeded];
  } else {
    const firstAssistantMessage = history.find((message) => message.role === "assistant");

    if (
  firstAssistantMessage &&
  (
    firstAssistantMessage.content.includes("Reasoning is trending up") ||
    firstAssistantMessage.content.includes("Quant accuracy dipped")
  )
) {
      const updatedMessage = await db.coachMessage.update({
        where: { id: firstAssistantMessage.id },
        data: { content: defaultGreeting },
      });

      history = history.map((message) => (message.id === updatedMessage.id ? updatedMessage : message));
    }
  }

  return NextResponse.json({
    messages: history.map((message) => ({ role: message.role, content: message.content })),
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
