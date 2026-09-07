import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LOGIN_HERO_ARTWORK,
  isLoginStoryCutout,
  resolveLoginHeroSrc,
} from "./login-story";

describe("login hero artwork", () => {
  it("resolves a static laptop still for each presentation", () => {
    assert.equal(resolveLoginHeroSrc("male"), LOGIN_HERO_ARTWORK.male);
    assert.equal(resolveLoginHeroSrc("female"), "/login/story/female-laptop.png");
    assert.equal(resolveLoginHeroSrc("neutral"), "/login/story/neutral-laptop.png");
    assert.equal(resolveLoginHeroSrc("custom"), "/login/story/custom-laptop.png");
  });

  it("marks numbered male cutouts correctly", () => {
    assert.equal(isLoginStoryCutout("/login/story/04_laptop_pose.png"), true);
    assert.equal(isLoginStoryCutout("/login/story/female-laptop.png"), false);
  });
});
