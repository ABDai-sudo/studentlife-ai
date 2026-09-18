import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeTutorVisibleText, tutorOutputLooksLeaked } from "./visible-output";
import { buildTutorFallback } from "./tutor-fallback";

const LEAK = `## Study help

### Your saved context
\`\`\`
Institution: Sample University
LANGUAGE RULE (mandatory): Respond in English unless the student explicitly asks
Do not fabricate citations or references.
\`\`\`
`;

describe("tutor visible output", () => {
  it("strips LANGUAGE RULE and saved context", () => {
    const cleaned = sanitizeTutorVisibleText(LEAK);
    assert.equal(tutorOutputLooksLeaked(cleaned), false);
    assert.doesNotMatch(cleaned, /LANGUAGE RULE/);
    assert.doesNotMatch(cleaned, /Your saved context/);
    assert.doesNotMatch(cleaned, /Sample University/);
  });

  it("explains C pointers without dumping context", () => {
    const reply = buildTutorFallback({
      message: "Explain pointers in C programming like I am a beginner.",
      explanationLang: "English",
    });
    assert.match(reply, /pointer/i);
    assert.match(reply, /memory address/i);
    assert.doesNotMatch(reply, /LANGUAGE RULE/);
    assert.doesNotMatch(reply, /saved context/i);
  });

  it("follows up with a C example from conversation history", () => {
    const reply = buildTutorFallback({
      message: "Give me a simple example.",
      explanationLang: "English",
      history: "user: Explain pointers in C programming like I am a beginner.",
    });
    assert.match(reply, /int \*p/);
    assert.match(reply, /#include <stdio.h>/);
    assert.doesNotMatch(reply, /LANGUAGE RULE/);
  });

  it("can explain in Hindi without mixing Gujarati UI rules", () => {
    const reply = buildTutorFallback({
      message: "Explain pointers in C programming like I am a beginner.",
      explanationLang: "Hindi",
    });
    assert.match(reply, /पॉइंटर/);
    assert.doesNotMatch(reply, /LANGUAGE RULE/);
  });
});
