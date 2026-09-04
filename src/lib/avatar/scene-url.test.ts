import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEV_LOCAL_SCENE,
  isAllowedAvatarSceneUrl,
  resolveAvatarSceneUrl,
} from "./scene-url";

describe("avatar scene URL", () => {
  it("defaults to the local test scene in development only", () => {
    assert.equal(resolveAvatarSceneUrl("", "development"), DEV_LOCAL_SCENE);
    assert.equal(resolveAvatarSceneUrl(undefined, "production"), null);
    assert.equal(resolveAvatarSceneUrl("   ", "test"), null);
  });

  it("accepts https spline.design in any environment", () => {
    const url = "https://my.spline.design/studentlife-test/scene";
    assert.equal(isAllowedAvatarSceneUrl(url, "production"), true);
    assert.equal(resolveAvatarSceneUrl(url, "production"), url);
  });

  it("rejects third-party and unsafe URLs", () => {
    assert.equal(
      isAllowedAvatarSceneUrl("https://example.com/scene.html", "development"),
      false
    );
    assert.equal(
      isAllowedAvatarSceneUrl("http://my.spline.design/x", "development"),
      false
    );
    assert.equal(
      isAllowedAvatarSceneUrl("/avatar/../secret.html", "development"),
      false
    );
    assert.equal(
      isAllowedAvatarSceneUrl("/avatar/dev-scene.html", "production"),
      false
    );
  });

  it("allows the same-origin test scene only in development", () => {
    assert.equal(
      isAllowedAvatarSceneUrl(DEV_LOCAL_SCENE, "development"),
      true
    );
    assert.equal(resolveAvatarSceneUrl(DEV_LOCAL_SCENE, "development"), DEV_LOCAL_SCENE);
  });
});
