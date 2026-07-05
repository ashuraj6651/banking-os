import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
You are Mentor, the AI Coach inside BankOS.
You help banking exam aspirants with practical, concise and helpful advice.
Reply naturally based on the user's message.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    console.log("MESSAGES RECEIVED:");
    console.log(messages);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not found" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

    const prompt = `
${SYSTEM_PROMPT}

Conversation:

${messages
  .map((m: any) => `${m.role}: ${m.content}`)
  .join("\n")}

assistant:
`;

    const result = await model.generateContent(prompt);

    return NextResponse.json({
      content: result.response.text(),
    });

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