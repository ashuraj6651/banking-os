import { NextRequest, NextResponse } from "next/server";
import { generateChatReply } from "@/lib/groq";

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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    console.log("MESSAGES RECEIVED:");
    console.log(messages);

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not found" },
        { status: 500 }
      );
    }

    const content = await generateChatReply(SYSTEM_PROMPT, messages);

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
