import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LOGIN_STORY_TIMING,
  loginStoryFormReady,
  loginStoryPoseForStage,
  loginStoryShowsAvatar,
  loginStoryShowsSpeech,
  loginStoryTiming,
  nextLoginStoryStage,
  resolveLoginStorySrc,
} from "./login-story";

describe("login story sequence", () => {
  it("hides the avatar on page load and keeps the form technically ready later", () => {
    assert.equal(loginStoryShowsAvatar("intro"), false);
    assert.equal(loginStoryShowsSpeech("intro"), false);
    assert.equal(loginStoryFormReady("intro"), false);
    assert.equal(loginStoryPoseForStage("intro"), null);
    assert.equal(loginStoryFormReady("settled"), true);
  });

  it("walks in, then sits with a laptop, then acknowledges without a geometric fallback", () => {
    assert.equal(loginStoryPoseForStage("entering"), "enter");
    assert.equal(loginStoryPoseForStage("settled"), "laptop");
    assert.equal(loginStoryPoseForStage("authenticating"), "laptop");
    assert.equal(loginStoryPoseForStage("success"), "success");
    assert.equal(loginStoryPoseForStage("exiting"), "exit");
    assert.equal(
      resolveLoginStorySrc("male", "enter"),
      "/login/story/male-enter.png"
    );
    assert.equal(
      resolveLoginStorySrc("female", "laptop"),
      "/login/story/female-laptop.png"
    );
    assert.equal(
      resolveLoginStorySrc("neutral", "success"),
      "/login/story/neutral-success.png"
    );
    assert.notEqual(
      resolveLoginStorySrc("male", "enter"),
      resolveLoginStorySrc("male", "laptop")
    );
  });

  it("advances intro to entering to settled, then success to exiting", () => {
    assert.equal(nextLoginStoryStage("intro", "tick"), "entering");
    assert.equal(nextLoginStoryStage("entering", "tick"), "settled");
    assert.equal(nextLoginStoryStage("settled", "submit"), "authenticating");
    assert.equal(nextLoginStoryStage("authenticating", "success"), "success");
    assert.equal(nextLoginStoryStage("success", "tick"), "exiting");
    assert.equal(nextLoginStoryStage("authenticating", "fail"), "settled");
    assert.equal(nextLoginStoryStage("intro", "reduce"), "settled");
  });

  it("keeps success acknowledgement under one second and shortens mobile", () => {
    assert.ok(LOGIN_STORY_TIMING.desktop.successMs <= 1000);
    assert.ok(LOGIN_STORY_TIMING.mobile.successMs <= 1000);
    assert.ok(loginStoryTiming(true).enteringMs < loginStoryTiming(false).enteringMs);
    assert.ok(
      LOGIN_STORY_TIMING.desktop.successMs + LOGIN_STORY_TIMING.desktop.exitingMs <= 1200
    );
  });
});
