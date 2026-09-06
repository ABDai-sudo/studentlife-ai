import type { LoginPresentationId } from "@/lib/avatar/login-preview";

export const LOGIN_STORY_STAGES = [
  "intro",
  "entering",
  "settled",
  "authenticating",
  "success",
  "exiting",
] as const;

export type LoginStoryStage = (typeof LOGIN_STORY_STAGES)[number];

export const LOGIN_STORY_POSES = [
  "enter",
  "laptop",
  "success",
  "exit",
] as const;

export type LoginStoryPose = (typeof LOGIN_STORY_POSES)[number];

/** Optional transparent WebM clips. Empty until real video assets exist. */
export const LOGIN_STORY_WEBM: Partial<
  Record<LoginPresentationId, Partial<Record<LoginStoryPose, string>>>
> = {};

export const LOGIN_STORY_TIMING = {
  desktop: {
    introMs: 500,
    enteringMs: 1800,
    formRevealMs: 420,
    successMs: 780,
    exitingMs: 320,
  },
  mobile: {
    introMs: 280,
    enteringMs: 1100,
    formRevealMs: 280,
    successMs: 700,
    exitingMs: 280,
  },
} as const;

export type LoginStoryTiming = (typeof LOGIN_STORY_TIMING)[keyof typeof LOGIN_STORY_TIMING];

export function loginStoryTiming(compact: boolean): LoginStoryTiming {
  return compact ? LOGIN_STORY_TIMING.mobile : LOGIN_STORY_TIMING.desktop;
}

export function loginStoryPoseForStage(
  stage: LoginStoryStage
): LoginStoryPose | null {
  switch (stage) {
    case "intro":
      return null;
    case "entering":
      return "enter";
    case "settled":
    case "authenticating":
      return "laptop";
    case "success":
      return "success";
    case "exiting":
      return "exit";
  }
}

export function loginStoryShowsAvatar(stage: LoginStoryStage): boolean {
  return stage !== "intro";
}

export function loginStoryShowsSpeech(stage: LoginStoryStage): boolean {
  return (
    stage === "settled" ||
    stage === "authenticating" ||
    stage === "success" ||
    stage === "exiting"
  );
}

export function loginStoryFormReady(stage: LoginStoryStage): boolean {
  return (
    stage === "settled" ||
    stage === "authenticating" ||
    stage === "success" ||
    stage === "exiting"
  );
}

export function resolveLoginStorySrc(
  presentation: LoginPresentationId,
  pose: LoginStoryPose
): string {
  const video = LOGIN_STORY_WEBM[presentation]?.[pose];
  if (video) return video;
  return `/login/story/${presentation}-${pose}.png`;
}

export function nextLoginStoryStage(
  stage: LoginStoryStage,
  event: "tick" | "submit" | "success" | "fail" | "reduce"
): LoginStoryStage {
  if (event === "reduce") return "settled";
  if (event === "fail") {
    return stage === "authenticating" || stage === "success" || stage === "exiting"
      ? "settled"
      : stage;
  }
  if (event === "submit") {
    return stage === "success" || stage === "exiting" ? stage : "authenticating";
  }
  if (event === "success") return "success";
  if (event !== "tick") return stage;
  if (stage === "intro") return "entering";
  if (stage === "entering") return "settled";
  if (stage === "success") return "exiting";
  return stage;
}
