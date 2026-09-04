import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLoginGreetingKey } from "./login-greeting";

describe("login greeting", () => {
  it("uses the default lock-in line", () => {
    assert.equal(
      getLoginGreetingKey({ broMode: false, examWeek: false }),
      "login.speech.default"
    );
  });

  it("uses Bro copy when personality is Campus Bro", () => {
    assert.equal(
      getLoginGreetingKey({ broMode: true, examWeek: false }),
      "login.speech.bro"
    );
  });

  it("uses exam copy only when a real exam/deadline hint exists", () => {
    assert.equal(
      getLoginGreetingKey({ broMode: true, examWeek: true }),
      "login.speech.exam"
    );
  });

  it("uses success copy after authentication, not a delayed greeting", () => {
    assert.equal(
      getLoginGreetingKey({
        phase: "success",
        broMode: true,
        examWeek: true,
      }),
      "login.speech.success"
    );
  });
});
