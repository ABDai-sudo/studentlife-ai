/**
 * Optional 3D scene URL. Production only accepts a configured
 * https spline.design URL. Development may use a same-origin test scene.
 * Never treat a missing URL as a production 3D dependency.
 */

export const DEV_LOCAL_SCENE = "/avatar/dev-scene.html";

const LOCAL_SCENE = /^\/avatar\/[a-z0-9][a-z0-9-]*\.html$/i;

function isSplineHost(hostname: string): boolean {
  return hostname === "my.spline.design" || hostname.endsWith(".spline.design");
}

export function isAllowedAvatarSceneUrl(
  url: string,
  nodeEnv: string = process.env.NODE_ENV
): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  if (LOCAL_SCENE.test(trimmed)) {
    return nodeEnv === "development";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    return isSplineHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function resolveAvatarSceneUrl(
  raw: string | null | undefined,
  nodeEnv: string = process.env.NODE_ENV
): string | null {
  const trimmed = raw?.trim() || "";
  if (trimmed) {
    return isAllowedAvatarSceneUrl(trimmed, nodeEnv) ? trimmed : null;
  }
  if (nodeEnv === "development") return DEV_LOCAL_SCENE;
  return null;
}
