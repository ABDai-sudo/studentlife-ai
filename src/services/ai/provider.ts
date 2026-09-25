import { safeLog } from "@/lib/security/safe-log";
import {
  GEMINI_MAX_ATTEMPTS,
  geminiBackoffMs,
  isRetryableGeminiStatus,
} from "@/services/ai/gemini-retry";

export type AiProviderName = "openai" | "gemini" | "rules";

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image"; mimeType: string; base64: string };

export type ChatTurn = {
  role: "system" | "user" | "assistant";
  parts: ChatContentPart[];
};

export type CompleteChatInput = {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
  temperature?: number;
};

export type CompleteChatResult = {
  text: string | null;
  provider: AiProviderName;
  error?:
    | "PROVIDER_UNAVAILABLE"
    | "PROVIDER_BUSY"
    | "MULTIMODAL_PROVIDER_REQUIRED"
    | "PROVIDER_ERROR";
};

export function getPreferredProvider(): AiProviderName {
  const pref = (process.env.AI_PROVIDER || "").toLowerCase();
  if (pref === "gemini") return "gemini";
  if (pref === "rules") return "rules";
  if (pref === "openai") return "openai";
  if (geminiConfigured() && !openaiConfigured()) return "gemini";
  return "openai";
}

function hasImages(messages: ChatTurn[]): boolean {
  return messages.some((m) => m.parts.some((p) => p.type === "image"));
}

function openaiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms = 70000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

type LegacyChatInput = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

function normalizeInput(
  input: CompleteChatInput | LegacyChatInput
): CompleteChatInput {
  if ("messages" in input && input.messages) return input;
  const legacy = input as LegacyChatInput;
  return {
    system: legacy.system,
    maxTokens: legacy.maxTokens,
    temperature: legacy.temperature,
    messages: [{ role: "user", parts: [{ type: "text", text: legacy.user }] }],
  };
}

export async function completeChat(
  input: CompleteChatInput | LegacyChatInput
): Promise<CompleteChatResult> {
  const normalized = normalizeInput(input);
  const maxTokens = normalized.maxTokens ?? 1400;
  const temperature = normalized.temperature ?? 0.45;
  const pref = getPreferredProvider();
  const images = hasImages(normalized.messages);

  if (pref === "rules") {
    return { text: null, provider: "rules" };
  }

  if (images && !openaiConfigured() && !geminiConfigured()) {
    return {
      text: null,
      provider: pref,
      error: "MULTIMODAL_PROVIDER_REQUIRED",
    };
  }

  const tryOpenAI = async () => {
    if (!openaiConfigured()) return null;
    return callOpenAI(normalized.system, normalized.messages, maxTokens, temperature);
  };
  const tryGemini = async () => {
    if (!geminiConfigured()) return null;
    return callGemini(normalized.system, normalized.messages, maxTokens, temperature);
  };

  if (pref === "gemini") {
    const gemini = await tryGemini();
    if (gemini?.text) return { text: gemini.text, provider: "gemini" };
    const fallback = await tryOpenAI();
    if (fallback) return { text: fallback, provider: "openai" };
    return {
      text: null,
      provider: "gemini",
      error: images && !openaiConfigured() && !geminiConfigured()
        ? "MULTIMODAL_PROVIDER_REQUIRED"
        : gemini?.busy
          ? "PROVIDER_BUSY"
          : "PROVIDER_UNAVAILABLE",
    };
  }

  const text = await tryOpenAI();
  if (text) return { text, provider: "openai" };
  const gemini = await tryGemini();
  if (gemini?.text) return { text: gemini.text, provider: "gemini" };
  return {
    text: null,
    provider: "openai",
    error: images && !openaiConfigured() && !geminiConfigured()
      ? "MULTIMODAL_PROVIDER_REQUIRED"
      : gemini?.busy
        ? "PROVIDER_BUSY"
        : "PROVIDER_UNAVAILABLE",
  };
}

/** Convenience wrapper for text-only callers. */
export async function completeTextChat(input: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<{ text: string | null; provider: AiProviderName }> {
  const result = await completeChat({
    system: input.system,
    messages: [{ role: "user", parts: [{ type: "text", text: input.user }] }],
    maxTokens: input.maxTokens,
  });
  return { text: result.text, provider: result.provider };
}

async function callOpenAI(
  system: string,
  messages: ChatTurn[],
  maxTokens: number,
  temperature: number
) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: system },
            ...messages.map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: toOpenAiContent(m.parts),
            })),
          ],
        }),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function toOpenAiContent(parts: ChatContentPart[]) {
  const images = parts.filter((p): p is Extract<ChatContentPart, { type: "image" }> => p.type === "image");
  const text = parts
    .filter((p): p is Extract<ChatContentPart, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("\n");
  if (!images.length) return text;
  return [
    { type: "text", text: text || "Please read the attached image." },
    ...images.map((img) => ({
      type: "image_url",
      image_url: {
        url: `data:${img.mimeType};base64,${img.base64}`,
      },
    })),
  ];
}

export const GEMINI_PRIMARY_MODEL = "gemini-3.8-flash";
export const GEMINI_FALLBACK_MODEL = "gemini-3.7-flash";

function geminiModels(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list = [preferred, GEMINI_PRIMARY_MODEL, GEMINI_FALLBACK_MODEL].filter(
    (m): m is string => Boolean(m)
  );
  return [...new Set(list)];
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

function toGeminiContents(messages: ChatTurn[]): { role: string; parts: GeminiPart[] }[] {
  const mapped = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: m.parts.map((part): GeminiPart =>
      part.type === "text"
        ? { text: part.text }
        : { inlineData: { mimeType: part.mimeType, data: part.base64 } }
    ),
  }));
  const merged: { role: string; parts: GeminiPart[] }[] = [];
  for (const turn of mapped) {
    const last = merged.at(-1);
    if (last && last.role === turn.role) {
      last.parts.push(...turn.parts);
    } else {
      merged.push({ role: turn.role, parts: [...turn.parts] });
    }
  }
  if (merged[0]?.role === "model") {
    merged.unshift({ role: "user", parts: [{ text: "Continue." }] });
  }
  return merged;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type GeminiAttempt =
  | { text: string }
  | { retryable: true; retryAfter: string | null }
  | { retryable: false };

async function callGemini(
  system: string,
  messages: ChatTurn[],
  maxTokens: number,
  temperature: number
): Promise<{ text: string | null; busy: boolean }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { text: null, busy: false };
  const contents = toGeminiContents(messages);
  if (!contents.length) return { text: null, busy: false };

  const models = geminiModels();
  let sawRetryable = false;

  for (const model of models) {
    for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS; attempt += 1) {
      const outcome = await geminiOnce(
        key,
        model,
        system,
        contents,
        maxTokens,
        temperature
      );
      if ("text" in outcome) return { text: outcome.text, busy: false };
      if (!outcome.retryable) break;
      sawRetryable = true;
      if (attempt + 1 >= GEMINI_MAX_ATTEMPTS) break;
      const jitter = Math.floor(Math.random() * 200);
      await sleep(geminiBackoffMs(attempt, outcome.retryAfter, jitter));
    }
  }

  return { text: null, busy: sawRetryable };
}

async function geminiOnce(
  key: string,
  model: string,
  system: string,
  contents: { role: string; parts: GeminiPart[] }[],
  maxTokens: number,
  temperature: number
): Promise<GeminiAttempt> {
  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      },
      25_000
    );
    if (!res.ok) {
      const errText = (await res.text()).slice(0, 400).replace(key, "[REDACTED]");
      safeLog("warn", "Gemini request failed", {
        model,
        status: res.status,
        error: errText,
      });
      if (isRetryableGeminiStatus(res.status)) {
        return { retryable: true, retryAfter: res.headers.get("retry-after") };
      }
      return { retryable: false };
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .map((p) => p.text || "")
      .join("\n")
      .trim();
    if (text) return { text };
    return { retryable: false };
  } catch (error) {
    safeLog("warn", "Gemini request threw", {
      model,
      error: String(error).replace(key, "[REDACTED]"),
    });
    return { retryable: true, retryAfter: null };
  }
}
