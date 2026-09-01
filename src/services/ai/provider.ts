export type AiProviderName = "openai" | "gemini" | "rules";

export function getPreferredProvider(): AiProviderName {
  const pref = (process.env.AI_PROVIDER || "openai").toLowerCase();
  if (pref === "gemini") return "gemini";
  if (pref === "rules") return "rules";
  return "openai";
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms = 20000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function completeChat(input: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<{ text: string | null; provider: AiProviderName }> {
  const maxTokens = input.maxTokens ?? 1200;
  const pref = getPreferredProvider();

  if (pref === "rules") {
    return { text: null, provider: "rules" };
  }

  if (pref === "gemini") {
    const text = await callGemini(input.system, input.user, maxTokens);
    if (text) return { text, provider: "gemini" };
    const fallback = await callOpenAI(input.system, input.user, maxTokens);
    if (fallback) return { text: fallback, provider: "openai" };
    return { text: null, provider: "rules" };
  }

  const text = await callOpenAI(input.system, input.user, maxTokens);
  if (text) return { text, provider: "openai" };
  const fallback = await callGemini(input.system, input.user, maxTokens);
  if (fallback) return { text: fallback, provider: "gemini" };
  return { text: null, provider: "rules" };
}

async function callOpenAI(system: string, user: string, maxTokens: number) {
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
          temperature: 0.4,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
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

async function callGemini(system: string, user: string, maxTokens: number) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${system}\n\nStudent request:\n${user}` }],
            },
          ],
          generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens },
        }),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}
