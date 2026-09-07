import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LOGIN_STORY_MALE_FRAMES,
  LOGIN_STORY_TIMING,
  loginStoryFormReady,
  loginStoryFrameSrcs,
  loginStoryMotion,
  loginStoryPoseForStage,
  loginStoryShowsAvatar,
  loginStoryShowsSpeech,
  loginStoryTiming,
  loginStoryWalkPose,
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
    assert.equal(loginStoryShowsSpeech("standing"), false);
  });

  it("uses the numbered male 6-pose pack with a walk flipbook", () => {
    assert.equal(loginStoryPoseForStage("walking", 0), "walk_a");
    assert.equal(loginStoryPoseForStage("walking", 1), "walk_b");
    assert.equal(loginStoryWalkPose(2), "walk_a");
    assert.equal(loginStoryPoseForStage("standing"), "standing");
    assert.equal(loginStoryPoseForStage("settled"), "laptop");
    assert.equal(loginStoryPoseForStage("success"), "success");
    assert.equal(loginStoryPoseForStage("exiting"), "exit");
    assert.equal(resolveLoginStorySrc("male", "walk_a"), LOGIN_STORY_MALE_FRAMES.walk_a);
    assert.equal(resolveLoginStorySrc("male", "walk_b"), "/login/story/02_walk_in_b.png");
    assert.equal(resolveLoginStorySrc("male", "standing"), "/login/story/03_settle_standing.png");
    assert.equal(resolveLoginStorySrc("male", "laptop"), "/login/story/04_laptop_pose.png");
    assert.equal(resolveLoginStorySrc("male", "success"), "/login/story/05_success_thumbs_up.png");
    assert.equal(resolveLoginStorySrc("male", "exit"), "/login/story/06_exit_back_view.png");
    const male = loginStoryFrameSrcs("male");
    assert.equal(new Set(male).size, 6);
    assert.equal(loginStoryMotion("walking"), "walking");
  });

  it("keeps female and neutral selectors on their own artwork", () => {
    assert.equal(
      resolveLoginStorySrc("female", "laptop"),
      "/login/story/female-laptop.png"
    );
    assert.equal(
      resolveLoginStorySrc("neutral", "success"),
      "/login/story/neutral-success.png"
    );
    assert.notEqual(
      resolveLoginStorySrc("female", "walk_a"),
      resolveLoginStorySrc("male", "walk_a")
    );
  });

  it("advances intro through walk to laptop, then success to exiting", () => {
    assert.equal(nextLoginStoryStage("intro", "tick"), "walking");
    assert.equal(nextLoginStoryStage("walking", "tick"), "standing");
    assert.equal(nextLoginStoryStage("standing", "tick"), "settled");
    assert.equal(nextLoginStoryStage("settled", "submit"), "authenticating");
    assert.equal(nextLoginStoryStage("authenticating", "success"), "success");
    assert.equal(nextLoginStoryStage("success", "tick"), "exiting");
    assert.equal(nextLoginStoryStage("authenticating", "fail"), "settled");
    assert.equal(nextLoginStoryStage("intro", "reduce"), "settled");
  });

  it("keeps a long visible walk and shortens it on mobile", () => {
    assert.equal(LOGIN_STORY_TIMING.desktop.introMs, 400);
    assert.ok(LOGIN_STORY_TIMING.desktop.walkingMs >= 2400);
    assert.ok(LOGIN_STORY_TIMING.desktop.walkStepMs <= 200);
    assert.equal(LOGIN_STORY_TIMING.desktop.successMs, 700);
    assert.ok(LOGIN_STORY_TIMING.desktop.idleReplayMs > 2500);
    assert.ok(loginStoryTiming(true).walkingMs < loginStoryTiming(false).walkingMs);
  });

  it("replays the walk sequence from the settled idle state", () => {
    assert.equal(nextLoginStoryStage("settled", "replay"), "walking");
    assert.equal(nextLoginStoryStage("authenticating", "replay"), "authenticating");
  });
});
