import Groq from "groq-sdk";

// Free, fast model on Groq's LPU hardware. No credit card needed.
// Swap to "llama-3.1-8b-instant" if you want even higher rate limits
// at slightly lower quality.
const GROQ_MODEL = "llama-3.3-70b-versatile";

let client: Groq | null = null;

function getClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not found");
  }
  if (!client) {
    // Without an explicit timeout, a slow/hung Groq connection could keep
    // the request (and every SDK retry) waiting indefinitely, which is what
    // made "Loading questions…" get stuck on the client with no way out.
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 20 * 1000, // 20s per request
      maxRetries: 1,
    });
  }
  return client;
}

/**
 * Generate plain text from a single prompt (mirrors the old
 * `model.generateContent(prompt).response.text()` Gemini pattern).
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const groq = getClient();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      ...(systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }]
        : []),
      { role: "user" as const, content: prompt },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}

/**
 * Generate a reply from a running chat-style conversation
 * (mirrors the old coach route's message-list usage).
 */
export async function generateChatReply(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const groq = getClient();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: m.content,
      })),
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}