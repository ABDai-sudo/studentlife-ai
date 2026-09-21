import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSimplePdf, looksLikePdfIntent } from "./pdf-generate";
import { extractPdfText } from "./pdf-text";
import { retrieveChunks } from "./chunk";
import { suggestCategoryFromDescription } from "../money/category-suggest";
import { createExpenseSchema } from "../validations/expense";
import { toneInstructions } from "../../services/ai/tones";

describe("core product recovery helpers", () => {
  it("builds a real PDF that starts with %PDF and has pages", () => {
    const bytes = buildSimplePdf({
      title: "Revision sheet",
      subtitle: "Pointers in C",
      sections: [
        { heading: "Definition", body: "A pointer stores a memory address." },
        { heading: "Example", body: "int *p = &x;" },
      ],
      answers: [{ heading: "Q1", body: "Use * to dereference." }],
    });
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    assert.match(bytes.toString("latin1"), /\/Type \/Page/);
    assert.match(bytes.toString("latin1"), /Answer key/);
    const extracted = extractPdfText(bytes);
    assert.match(extracted.text, /pointer/i);
  });

  it("detects PDF generation intent", () => {
    assert.equal(looksLikePdfIntent("make notes PDF"), true);
    assert.equal(looksLikePdfIntent("what is gravity"), false);
  });

  it("retrieves overlapping document chunks", () => {
    const text = "Alpha topic. ".repeat(80) + "Binary search trees. " + "Other. ".repeat(80);
    const chunks = retrieveChunks(text, "binary search trees", 2);
    assert.ok(chunks.some((c) => /binary search/i.test(c)));
  });

  it("defaults amount-only expenses to no category in the schema", () => {
    const parsed = createExpenseSchema.safeParse({ amount: 120, currency: "INR" });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.category, undefined);
    }
    assert.equal(suggestCategoryFromDescription(undefined), null);
    assert.equal(suggestCategoryFromDescription("Swiggy dinner"), "FOOD");
  });

  it("uses distinct tone instructions for student-facing modes", () => {
    const normal = toneInstructions("PROFESSIONAL");
    const tutor = toneInstructions("FRIENDLY");
    const exam = toneInstructions("ACADEMIC_VILLAIN");
    const casual = toneInstructions("CAMPUS_BRO");
    assert.match(normal, /NORMAL/);
    assert.match(tutor, /TUTOR/);
    assert.match(exam, /EXAM/);
    assert.match(casual, /CASUAL/);
    assert.notEqual(tutor, exam);
    assert.notEqual(normal, casual);
  });
});
