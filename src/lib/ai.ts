import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

/**
 * Multi-provider AI layer with automatic fallback + degradation.
 *
 * Order of attempts:
 *   1. Gemini   (models: gemini-2.0-flash        -> gemini-1.5-flash)
 *   2. Groq     (models: llama-3.3-70b-versatile -> llama-3.1-8b-instant)
 *   3. OpenAI   (models: gpt-4o-mini              -> gpt-3.5-turbo)
 *
 * For each provider we first try its "primary" (best quality) model.
 * If that call fails (rate limit / quota / any error) we "degrade" to
 * that same provider's cheaper/lighter model before giving up on the
 * provider entirely and moving to the next one in the chain.
 *
 * A provider is skipped completely if its API key env var isn't set,
 * so you don't need all three keys — it works with just one, but gets
 * more resilient the more you add.
 */

type ChatMessage = { role: string; content: string };

type AttemptFn = (
  systemPrompt: string | undefined,
  messages: ChatMessage[],
  model: string
) => Promise<string>;

interface ProviderConfig {
  name: string;
  keyEnv: string;
  models: string[]; // ordered: best -> most-degraded
  call: AttemptFn;
}

function normalizeGeminiMessages(messages: ChatMessage[]): ChatMessage[] {
  const cleaned: ChatMessage[] = [];

  for (const msg of messages) {
    const role = msg.role === "assistant" ? "assistant" : "user";

    if (cleaned.length === 0) {
      if (role !== "user") continue;
      cleaned.push({ role, content: msg.content });
      continue;
    }

    const last = cleaned[cleaned.length - 1];

    if (last.role === role) {
      last.content += "\n\n" + msg.content;
    } else {
      cleaned.push({ role, content: msg.content });
    }
  }

  return cleaned;
}
// ---------- Gemini ----------
let geminiClient: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return geminiClient;
}
const callGemini: AttemptFn = async (systemPrompt, messages, model) => {
  const genAI = getGemini();
  const genModel = genAI.getGenerativeModel({
    model,
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  });

  if (messages.length === 1 && messages[0].role === "user") {
    const result = await genModel.generateContent(messages[0].content);
    return result.response.text() ?? "";
  }

  // Gemini requires the conversation to start with a 'user' turn — drop
  // any leading assistant messages (e.g. a seeded greeting) so history
  // never opens with role 'model'.
  const trimmed = normalizeGeminiMessages(messages);
  
  if (trimmed.length === 0) {
    // Nothing usable for Gemini's chat format — fall back to a plain
    // single-shot prompt using the last message's content, if any.
    const last = messages[messages.length - 1];
    if (!last) return "";
    const result = await genModel.generateContent(last.content);
    return result.response.text() ?? "";
  }

  if (trimmed.length === 1) {
    const result = await genModel.generateContent(trimmed[0].content);
    return result.response.text() ?? "";
  }

  // Multi-turn: everything except the final message becomes history,
  // the final message is sent as the new prompt.
  const history = trimmed.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const last = trimmed[trimmed.length - 1];

  const chat = genModel.startChat({ history });
  const result = await chat.sendMessage(last.content);
  return result.response.text() ?? "";
};

// ---------- Groq ----------
let groqClient: Groq | null = null;
function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 20 * 1000,
      maxRetries: 1,
    });
  }
  return groqClient;
}
const callGroq: AttemptFn = async (systemPrompt, messages, model) => {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      ...(systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }]
        : []),
      ...messages.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: m.content,
      })),
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
};

// ---------- OpenAI ----------
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 20 * 1000,
      maxRetries: 1,
    });
  }
  return openaiClient;
}
const callOpenAI: AttemptFn = async (systemPrompt, messages, model) => {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      ...(systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }]
        : []),
      ...messages.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: m.content,
      })),
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
};

const PROVIDERS: ProviderConfig[] = [
  {
    name: "gemini",
    keyEnv: "GEMINI_API_KEY",
    models: ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.0-flash"],
    call: callGemini,
  },
  {
    name: "groq",
    keyEnv: "GROQ_API_KEY",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
    call: callGroq,
  },
  {
    name: "openai",
    keyEnv: "OPENAI_API_KEY",
    models: ["gpt-4o-mini", "gpt-3.5-turbo"],
    call: callOpenAI,
  },
];

/** True if at least one provider has a key configured. */
export function hasAnyAIProvider(): boolean {
  return PROVIDERS.some((p) => !!process.env[p.keyEnv]);
}

function isRateLimitOrQuotaError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err).toLowerCase();
  const status = (err as { status?: number })?.status;
  return (
    status === 429 ||
    status === 402 ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("429") ||
    msg.includes("insufficient_quota") ||
    msg.includes("resource_exhausted")
  );
}

async function runChain(
  systemPrompt: string | undefined,
  messages: ChatMessage[]
): Promise<string> {
  const errors: string[] = [];

  for (const provider of PROVIDERS) {
    if (!process.env[provider.keyEnv]) {
      console.log(`[ai] skip ${provider.name}: no API key set`);
      continue; // no key -> skip provider
    }

    for (const model of provider.models) {
      try {
        console.log(`[ai] trying ${provider.name}/${model}...`);
        const text = await provider.call(systemPrompt, messages, model);
        if (text && text.trim().length > 0) {
          console.log(`[ai] ✅ success via ${provider.name}/${model}`);
          return text;
        }
        console.log(`[ai] ⚠️ ${provider.name}/${model} returned empty response`);
        errors.push(`${provider.name}/${model}: empty response`);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.log(`[ai] ❌ ${provider.name}/${model} failed: ${reason}`);
        errors.push(`${provider.name}/${model}: ${reason}`);

        // Only bother stepping down to the degraded model on this same
        // provider if it looks like a limit/quota problem. Other errors
        // (bad key, network) will fail the same way on the smaller model
        // too, so just move straight to the next provider.
        if (!isRateLimitOrQuotaError(err)) {
          console.log(`[ai] → moving to next provider (not a rate-limit error)`);
          break;
        }
        console.log(`[ai] → rate-limited, degrading model on same provider`);
      }
    }
  }

  console.log(`[ai] 🚨 all providers exhausted`);
  throw new Error(
    `All AI providers failed or are unconfigured. Attempts:\n${errors.join(
      "\n"
    )}`
  );
}

/**
 * Pings every configured provider independently (bypassing the fallback
 * chain) and reports which ones actually work right now. Useful for a
 * health-check/diagnostic endpoint.
 */
export async function testAllProviders(): Promise<
  {
    provider: string;
    configured: boolean;
    model: string | null;
    ok: boolean;
    error: string | null;
    latencyMs: number | null;
  }[]
> {
  const results: {
    provider: string;
    configured: boolean;
    model: string | null;
    ok: boolean;
    error: string | null;
    latencyMs: number | null;
  }[] = [];

  for (const provider of PROVIDERS) {
    const configured = !!process.env[provider.keyEnv];
    if (!configured) {
      results.push({
        provider: provider.name,
        configured: false,
        model: null,
        ok: false,
        error: "No API key set",
        latencyMs: null,
      });
      continue;
    }

    const model = provider.models[0]; // test the primary model only
    const start = Date.now();
    try {
      const text = await provider.call(
        undefined,
        [{ role: "user", content: "Reply with exactly: OK" }],
        model
      );
      results.push({
        provider: provider.name,
        configured: true,
        model,
        ok: !!text && text.trim().length > 0,
        error: null,
        latencyMs: Date.now() - start,
      });
    } catch (err) {
      results.push({
        provider: provider.name,
        configured: true,
        model,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - start,
      });
    }
  }

  return results;
}
export async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  return runChain(systemPrompt, [{ role: "user", content: prompt }]);
}

/**
 * Generate a reply from a running chat-style conversation.
 */
export async function generateChatReply(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  return runChain(systemPrompt, messages);
}
