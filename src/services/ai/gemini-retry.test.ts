import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { completeChat } from "@/services/ai/provider";
import {
  GEMINI_MAX_ATTEMPTS,
  geminiBackoffMs,
  isRetryableGeminiStatus,
} from "@/services/ai/gemini-retry";

const originalFetch = globalThis.fetch;
const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
  GEMINI_RETRY_BASE_MS: process.env.GEMINI_RETRY_BASE_MS,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
  process.env.AI_PROVIDER = env.AI_PROVIDER;
  process.env.GEMINI_RETRY_BASE_MS = env.GEMINI_RETRY_BASE_MS;
  process.env.GEMINI_MODEL = env.GEMINI_MODEL;
});

describe("gemini retry policy", () => {
  it("retries only 429 and 503", () => {
    assert.equal(isRetryableGeminiStatus(429), true);
    assert.equal(isRetryableGeminiStatus(503), true);
    assert.equal(isRetryableGeminiStatus(400), false);
    assert.equal(isRetryableGeminiStatus(404), false);
    assert.equal(GEMINI_MAX_ATTEMPTS, 3);
    assert.ok(geminiBackoffMs(0, null) >= 0);
    assert.ok(geminiBackoffMs(1, null) >= geminiBackoffMs(0, null));
    assert.equal(geminiBackoffMs(0, "1"), 1000);
    assert.equal(geminiBackoffMs(0, "30"), geminiBackoffMs(0, null));
  });

  it("retries a 503 and then returns the real answer", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "unit-test-key";
    process.env.GEMINI_MODEL = "gemini-test";
    process.env.GEMINI_RETRY_BASE_MS = "1";
    delete process.env.OPENAI_API_KEY;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      if (calls === 1) {
        return new Response(
          JSON.stringify({ error: { code: 503, message: "high demand" } }),
          { status: 503, headers: { "content-type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "real answer" }] } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as typeof fetch;

    const result = await completeChat({
      system: "test",
      user: "question",
      maxTokens: 20,
    });
    assert.equal(result.text, "real answer");
    assert.equal(result.provider, "gemini");
    assert.equal(result.error, undefined);
    assert.equal(calls, 2);
  });

  it("stops after the attempt cap and does not invent an answer", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "unit-test-key";
    process.env.GEMINI_MODEL = "gemini-test";
    process.env.GEMINI_RETRY_BASE_MS = "1";
    delete process.env.OPENAI_API_KEY;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(
        JSON.stringify({ error: { code: 503, message: "high demand" } }),
        { status: 503 }
      );
    }) as typeof fetch;

    const result = await completeChat({
      system: "test",
      user: "question",
      maxTokens: 20,
    });
    assert.equal(result.text, null);
    assert.equal(result.error, "PROVIDER_BUSY");
    assert.equal(calls, GEMINI_MAX_ATTEMPTS);
    assert.ok(calls <= 3);
  });
});
