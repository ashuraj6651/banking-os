import { NextRequest, NextResponse } from "next/server";
import {
  generateChatReply,
  hasAnyAIProvider,
  isLocalOllamaMode,
} from "@/lib/ai";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

const WEEKLY_CHAT_LIMIT = 20;
const QUOTA_MARKER = "__BANKOS_WEEKLY_QUOTA__";

const SYSTEM_PROMPT = `
You are Mentor, the AI Coach inside BankOS. Help aspirants prepare for banking exams such as SBI PO, IBPS PO, IBPS Clerk and RRB PO.

Answer rules:
- Give accurate, practical and complete advice.
- Match the answer length to the question. Keep simple answers brief; make plans and explanations detailed enough to use.
- Never invent the user's scores, history, schedule or performance. Use only facts provided in the chat.
- If information is missing, say what you need instead of guessing.
- Finish every answer with a complete sentence. Never leave a heading or bullet unfinished.

Formatting rules:
- Use short headings and normal Markdown bullet lists when helpful.
- Do not use tables, pipe characters as table separators, HTML, or <br> tags.
- Keep plans to at most 6 main bullets unless the user asks for more.
- Avoid repeating advice.
`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function getISTWeekRange() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const dateParts = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const year = Number(dateParts.year);
  const month = Number(dateParts.month);
  const day = Number(dateParts.day);

  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;

  // Monday 00:00 IST is Sunday 18:30 UTC.
  const start = new Date(
    Date.UTC(year, month - 1, day - daysSinceMonday, 0, 0, 0) -
      (5 * 60 + 30) * 60 * 1000,
  );
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  return { start, end };
}

function getDefaultGreeting(name?: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  return `${greeting}${name ? `, ${name}` : ""}. 👋

Welcome back to BankOS. I'm your AI Mentor, here to help you prepare smarter.

I can help with Quant, Reasoning, English, General Awareness, mock analysis, and study planning. What would you like to work on today?`;
}

async function getWeeklyUsage(profileId: string) {
  const { start, end } = getISTWeekRange();

  return db.coachMessage.count({
    where: {
      profileId,
      role: "user",
      createdAt: { gte: start, lt: end },
    },
  });
}

// GET /api/coach — return visible chat history and this week's quota.
export async function GET() {
  const profile = await getProfile();
  const defaultGreeting = getDefaultGreeting(profile?.name);

  if (!profile) {
    return NextResponse.json({
      messages: [{ role: "assistant", content: defaultGreeting }],
      weeklyLimit: WEEKLY_CHAT_LIMIT,
      usedThisWeek: 0,
      remainingThisWeek: WEEKLY_CHAT_LIMIT,
      isUnlimited: isLocalOllamaMode(),
    });
  }

  // Quota marker rows are kept in the database but hidden from the chat.
  let history = await db.coachMessage.findMany({
    where: {
      profileId: profile.id,
      NOT: { content: QUOTA_MARKER },
    },
    orderBy: { createdAt: "asc" },
  });

  if (history.length === 0) {
    const greeting = await db.coachMessage.create({
      data: {
        profileId: profile.id,
        role: "assistant",
        content: defaultGreeting,
      },
    });

    history = [greeting];
  } else {
    const firstAssistantMessage = history.find(
      (message) => message.role === "assistant",
    );

    if (
      firstAssistantMessage &&
      (firstAssistantMessage.content.includes("Reasoning is trending up") ||
        firstAssistantMessage.content.includes("Quant accuracy dipped"))
    ) {
      const updatedMessage = await db.coachMessage.update({
        where: { id: firstAssistantMessage.id },
        data: { content: defaultGreeting },
      });

      history = history.map((message) =>
        message.id === updatedMessage.id ? updatedMessage : message,
      );
    }
  }

  const usedThisWeek = await getWeeklyUsage(profile.id);

  return NextResponse.json({
    messages: history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    weeklyLimit: WEEKLY_CHAT_LIMIT,
    usedThisWeek,
    remainingThisWeek: Math.max(0, WEEKLY_CHAT_LIMIT - usedThisWeek),
    isUnlimited: isLocalOllamaMode(),
  });
}

// POST /api/coach — check quota, generate reply, then save both messages.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessages: unknown = body?.messages;

    if (!Array.isArray(rawMessages)) {
      return NextResponse.json(
        { error: "Invalid chat messages." },
        { status: 400 },
      );
    }

    const messages: ChatMessage[] = rawMessages.filter(
      (message): message is ChatMessage =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    );

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "Type a message first." },
        { status: 400 },
      );
    }

    if (!hasAnyAIProvider()) {
      return NextResponse.json(
        {
          error:
            "Ollama is unavailable locally. Start Ollama and pull the configured model. On Vercel, add GROQ_API_KEY or GEMINI_API_KEY.",
        },
        { status: 500 },
      );
    }

    const profile = await getProfile();
    let usedThisWeek = 0;

    if (profile) {
      usedThisWeek = await getWeeklyUsage(profile.id);

      if (!isLocalOllamaMode() && usedThisWeek >= WEEKLY_CHAT_LIMIT) {
        return NextResponse.json(
          {
            error: "You've used all 20 AI Coach chats for this week.",
            weeklyLimit: WEEKLY_CHAT_LIMIT,
            usedThisWeek,
            remainingThisWeek: 0,
          },
          { status: 429 },
        );
      }
    }

    const recentMessages = messages.slice(-8).map((message) => ({
      role: message.role,
      content: message.content.slice(0, 1500),
    }));

    const content = await generateChatReply(SYSTEM_PROMPT, recentMessages);

    if (!content.trim()) {
      throw new Error("The AI provider returned an empty reply. Please retry.");
    }

    if (profile) {
      await db.$transaction([
        db.coachMessage.create({
          data: {
            profileId: profile.id,
            role: "user",
            content: lastUserMessage.content,
          },
        }),
        db.coachMessage.create({
          data: {
            profileId: profile.id,
            role: "assistant",
            content,
          },
        }),
      ]);
    }

    const usedAfter = profile ? usedThisWeek + 1 : usedThisWeek;

    return NextResponse.json({
      content,
      weeklyLimit: WEEKLY_CHAT_LIMIT,
      usedThisWeek: usedAfter,
      remainingThisWeek: Math.max(0, WEEKLY_CHAT_LIMIT - usedAfter),
      isUnlimited: isLocalOllamaMode(),
    });
  } catch (error) {
    console.error("AI Coach error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// DELETE /api/coach — clear chat text while keeping this week's quota count.
export async function DELETE() {
  const profile = await getProfile();

  if (!profile) {
    return NextResponse.json({ ok: true });
  }

  const { start, end } = getISTWeekRange();

  await db.$transaction(async (transaction) => {
    const usedThisWeek = await transaction.coachMessage.count({
      where: {
        profileId: profile.id,
        role: "user",
        createdAt: { gte: start, lt: end },
      },
    });

    await transaction.coachMessage.deleteMany({
      where: { profileId: profile.id },
    });

    // Restore the weekly count as hidden marker rows after clearing chat text.
    if (usedThisWeek > 0) {
      await transaction.coachMessage.createMany({
        data: Array.from({ length: usedThisWeek }, () => ({
          profileId: profile.id,
          role: "user",
          content: QUOTA_MARKER,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
