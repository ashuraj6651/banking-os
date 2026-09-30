import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ChatMessage = {
  role: string;
  content: string;
};

type AttemptFn = (
  systemPrompt: string | undefined,
  messages: ChatMessage[],
  model: string,
) => Promise<string>;

interface ProviderConfig {
  name: string;
  keyEnv?: string;
  enabled?: () => boolean;
  models: string[];
  call: AttemptFn;
}

const MAX_OUTPUT_TOKENS = 1000;

let geminiClient: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return geminiClient;
}

const callGemini: AttemptFn = async (systemPrompt, messages, model) => {
  const genModel = getGemini().getGenerativeModel({
    model,
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.35,
    },
  });

  if (messages.length === 1 && messages[0].role === "user") {
    const result = await genModel.generateContent(messages[0].content);
    const candidate = result.response.candidates?.[0];

    if (candidate?.finishReason === "MAX_TOKENS") {
      throw new Error("Gemini reply reached its output limit.");
    }

    return result.response.text() ?? "";
  }

  const firstUserIndex = messages.findIndex((message) => message.role === "user");
  const trimmed =
    firstUserIndex === -1 ? [] : messages.slice(firstUserIndex);

  if (trimmed.length <= 1) {
    const last = trimmed[trimmed.length - 1] ?? messages[messages.length - 1];
    if (!last) return "";

    const result = await genModel.generateContent(last.content);
    const candidate = result.response.candidates?.[0];

    if (candidate?.finishReason === "MAX_TOKENS") {
      throw new Error("Gemini reply reached its output limit.");
    }

    return result.response.text() ?? "";
  }

  const history = trimmed.slice(0, -1).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  const result = await genModel
    .startChat({ history })
    .sendMessage(trimmed[trimmed.length - 1].content);

  const candidate = result.response.candidates?.[0];

  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error("Gemini reply reached its output limit.");
  }

  return result.response.text() ?? "";
};

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 30 * 1000,
      maxRetries: 1,
    });
  }
  return groqClient;
}

const callGroq: AttemptFn = async (systemPrompt, messages, model) => {
  const completion = await getGroq().chat.completions.create({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.35,
    messages: [
      ...(systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }]
        : []),
      ...messages.map((message) => ({
        role: (message.role === "assistant" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: message.content,
      })),
    ],
  });

  const choice = completion.choices[0];

  if (choice?.finish_reason === "length") {
    throw new Error("Groq reply reached its output limit.");
  }

  return choice?.message?.content ?? "";
};

const callOpenAI: AttemptFn = async (systemPrompt, messages, model) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not found");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        ...(systemPrompt
          ? [{ role: "system", content: systemPrompt }]
          : []),
        ...messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        })),
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI request failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = await response.json();
  const choice = payload?.choices?.[0];

  if (choice?.finish_reason === "length") {
    throw new Error("OpenAI reply reached its output limit.");
  }

  return choice?.message?.content?.toString?.() ?? "";
};

// Ollama runs on the developer's own machine. Keep it out of production so
// Vercel always uses the configured hosted providers (Gemini/Groq).
export const isLocalOllamaMode = () => process.env.NODE_ENV !== "production";
const isLocalOllamaEnabled = isLocalOllamaMode;

const callOllama: AttemptFn = async (systemPrompt, messages, model) => {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434")
    .replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        })),
      ],
      options: { temperature: 0.35, num_predict: MAX_OUTPUT_TOKENS },
    }),
    signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama request failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = await response.json();
  return typeof payload?.message?.content === "string"
    ? payload.message.content
    : "";
};

const PROVIDERS: ProviderConfig[] = [
  {
    name: "ollama-local",
    enabled: isLocalOllamaEnabled,
    models: [process.env.OLLAMA_MODEL || "llama3.2:3b"],
    call: callOllama,
  },
  {
    name: "groq",
    keyEnv: "GROQ_API_KEY",
    models: ["openai/gpt-oss-20b"],
    call: callGroq,
  },
  {
    name: "gemini",
    keyEnv: "GEMINI_API_KEY",
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
  const activeProviders = isLocalOllamaMode()
    ? PROVIDERS.filter((provider) => provider.name === "ollama-local")
    : PROVIDERS.filter((provider) => provider.name !== "ollama-local");

  return activeProviders.some((provider) =>
    provider.enabled ? provider.enabled() : !!provider.keyEnv && !!process.env[provider.keyEnv],
  );
}

function isRetryableProviderError(error: unknown): boolean {
  const message = String((error as Error)?.message ?? error).toLowerCase();
  const status = (error as { status?: number })?.status;

  return (
    status === 404 ||
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 402 ||
    message.includes("model_not_found") ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("429") ||
    message.includes("insufficient_quota") ||
    message.includes("resource_exhausted") ||
    message.includes("service unavailable")
  );
}

const ATTEMPT_TIMEOUT_MS = 35_000;

function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label}: timed out after ${milliseconds}ms`)),
      milliseconds,
    );

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function runChain(
  systemPrompt: string | undefined,
  messages: ChatMessage[],
): Promise<string> {
  const errors: string[] = [];
  const activeProviders = isLocalOllamaMode()
    ? PROVIDERS.filter((provider) => provider.name === "ollama-local")
    : PROVIDERS.filter((provider) => provider.name !== "ollama-local");

  for (const provider of activeProviders) {
    const configured = provider.enabled
      ? provider.enabled()
      : !!provider.keyEnv && !!process.env[provider.keyEnv];
    if (!configured) continue;

    for (const model of provider.models) {
      try {
        const text = await withTimeout(
          provider.call(systemPrompt, messages, model),
          ATTEMPT_TIMEOUT_MS,
          `${provider.name}/${model}`,
        );

        if (text?.trim()) return text;

        errors.push(`${provider.name}/${model}: empty response`);
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : String(error);

        errors.push(`${provider.name}/${model}: ${reason}`);

        // Try the next provider if this provider fails or hits its output cap.
        if (!isRetryableProviderError(error)) break;
      }
    }
  }

  throw new Error(
    `All AI providers failed or are unconfigured. Attempts:\n${errors.join("\n")}`,
  );
}

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
    const configured = provider.enabled
      ? provider.enabled()
      : !!provider.keyEnv && !!process.env[provider.keyEnv];

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

    const model = provider.models[0];
    const start = Date.now();

    try {
      const text = await provider.call(
        undefined,
        [{ role: "user", content: "Reply with exactly: OK" }],
        model,
      );

      results.push({
        provider: provider.name,
        configured: true,
        model,
        ok: !!text?.trim(),
        error: null,
        latencyMs: Date.now() - start,
      });
    } catch (error) {
      results.push({
        provider: provider.name,
        configured: true,
        model,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        latencyMs: Date.now() - start,
      });
    }
  }

  return results;
}

export function generateText(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  return runChain(systemPrompt, [{ role: "user", content: prompt }]);
}

export function generateChatReply(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
  return runChain(systemPrompt, messages);
}
