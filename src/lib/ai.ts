import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ChatMessage = { role: string; content: string };
type AttemptFn = (systemPrompt: string | undefined, messages: ChatMessage[], model: string) => Promise<string>;
interface ProviderConfig { name: string; keyEnv: string; models: string[]; call: AttemptFn; }

let geminiClient: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!geminiClient) geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return geminiClient;
}
const callGemini: AttemptFn = async (systemPrompt, messages, model) => {
  const genModel = getGemini().getGenerativeModel({ model, ...(systemPrompt ? { systemInstruction: systemPrompt } : {}) });
  if (messages.length === 1 && messages[0].role === "user") {
    const result = await genModel.generateContent(messages[0].content);
    return result.response.text() ?? "";
  }
  const firstUserIdx = messages.findIndex((m) => m.role === "user");
  const trimmed = firstUserIdx === -1 ? [] : messages.slice(firstUserIdx);
  if (trimmed.length <= 1) {
    const last = trimmed[trimmed.length - 1] ?? messages[messages.length - 1];
    if (!last) return "";
    const result = await genModel.generateContent(last.content);
    return result.response.text() ?? "";
  }
  const history = trimmed.slice(0, -1).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const result = await genModel.startChat({ history }).sendMessage(trimmed[trimmed.length - 1].content);
  return result.response.text() ?? "";
};

let groqClient: Groq | null = null;
function getGroq(): Groq {
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 20 * 1000, maxRetries: 1 });
  return groqClient;
}
const callGroq: AttemptFn = async (systemPrompt, messages, model) => {
  const completion = await getGroq().chat.completions.create({
    model,
    messages: [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      ...messages.map((m) => ({ role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user", content: m.content })),
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
};

const callOpenAI: AttemptFn = async (systemPrompt, messages, model) => {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not found");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model, temperature: 0.2, max_tokens: 800,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI request failed (${response.status}): ${await response.text()}`);
  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.toString?.() ?? "";
};

const PROVIDERS: ProviderConfig[] = [
  {
    name: "groq",
    keyEnv: "GROQ_API_KEY",
    // llama-3.3-70b-versatile was retired/unavailable for this key.
    models: ["llama-3.1-8b-instant"],
    call: callGroq,
  },
  {
    name: "gemini",
    keyEnv: "GEMINI_API_KEY",
    // Do not use the unavailable gemini-3.5-flash / gemini-3.1-flash-lite IDs.
    models: ["gemini-2.0-flash"],
    call: callGemini,
  },
  {
    name: "openai",
    keyEnv: "OPENAI_API_KEY",
    models: ["gpt-4o-mini"],
    call: callOpenAI,
  },
];

export function hasAnyAIProvider(): boolean {
  return PROVIDERS.some((p) => !!process.env[p.keyEnv]);
}

function isRetryableProviderError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err).toLowerCase();
  const status = (err as { status?: number })?.status;
  return status === 404 || status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || status === 402 || msg.includes("model_not_found") || msg.includes("rate limit") || msg.includes("quota") || msg.includes("429") || msg.includes("insufficient_quota") || msg.includes("resource_exhausted") || msg.includes("service unavailable");
}

const ATTEMPT_TIMEOUT_MS = 12_000;
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}: timed out after ${ms}ms`)), ms);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

async function runChain(systemPrompt: string | undefined, messages: ChatMessage[]): Promise<string> {
  const errors: string[] = [];
  for (const provider of PROVIDERS) {
    if (!process.env[provider.keyEnv]) continue;
    for (const model of provider.models) {
      try {
        const text = await withTimeout(provider.call(systemPrompt, messages, model), ATTEMPT_TIMEOUT_MS, `${provider.name}/${model}`);
        if (text?.trim()) return text;
        errors.push(`${provider.name}/${model}: empty response`);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        errors.push(`${provider.name}/${model}: ${reason}`);
        // Continue through the chain for retired models, transient outages, and quota errors.
        if (!isRetryableProviderError(err)) break;
      }
    }
  }
  throw new Error(`All AI providers failed or are unconfigured. Attempts:\n${errors.join("\n")}`);
}

export async function testAllProviders(): Promise<{ provider: string; configured: boolean; model: string | null; ok: boolean; error: string | null; latencyMs: number | null }[]> {
  const results: { provider: string; configured: boolean; model: string | null; ok: boolean; error: string | null; latencyMs: number | null }[] = [];
  for (const provider of PROVIDERS) {
    const configured = !!process.env[provider.keyEnv];
    if (!configured) { results.push({ provider: provider.name, configured: false, model: null, ok: false, error: "No API key set", latencyMs: null }); continue; }
    const model = provider.models[0];
    const start = Date.now();
    try {
      const text = await provider.call(undefined, [{ role: "user", content: "Reply with exactly: OK" }], model);
      results.push({ provider: provider.name, configured: true, model, ok: !!text?.trim(), error: null, latencyMs: Date.now() - start });
    } catch (err) {
      results.push({ provider: provider.name, configured: true, model, ok: false, error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - start });
    }
  }
  return results;
}

export function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  return runChain(systemPrompt, [{ role: "user", content: prompt }]);
}

export function generateChatReply(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  return runChain(systemPrompt, messages);
}
