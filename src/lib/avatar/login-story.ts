import type { LoginPresentationId } from "@/lib/avatar/login-preview";

export const LOGIN_STORY_STAGES = [
  "intro",
  "walkA",
  "walkB",
  "standing",
  "settled",
  "authenticating",
  "success",
  "exiting",
] as const;

export type LoginStoryStage = (typeof LOGIN_STORY_STAGES)[number];

export const LOGIN_STORY_POSES = [
  "walk_a",
  "walk_b",
  "standing",
  "laptop",
  "success",
  "exit",
] as const;

export type LoginStoryPose = (typeof LOGIN_STORY_POSES)[number];

export const LOGIN_STORY_MALE_FRAMES: Record<LoginStoryPose, string> = {
  walk_a: "/login/story/01_walk_in_a.png",
  walk_b: "/login/story/02_walk_in_b.png",
  standing: "/login/story/03_settle_standing.png",
  laptop: "/login/story/04_laptop_pose.png",
  success: "/login/story/05_success_thumbs_up.png",
  exit: "/login/story/06_exit_back_view.png",
};

export const LOGIN_STORY_TIMING = {
  desktop: {
    introMs: 450,
    walkHoldMs: 700,
    walkCrossfadeMs: 1100,
    standingMs: 700,
    successMs: 700,
    exitingMs: 620,
    poseCrossfadeMs: 450,
    idleReplayMs: 4200,
  },
  mobile: {
    introMs: 280,
    walkHoldMs: 420,
    walkCrossfadeMs: 780,
    standingMs: 480,
    successMs: 700,
    exitingMs: 460,
    poseCrossfadeMs: 320,
    idleReplayMs: 3600,
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
    case "walkA":
      return "walk_a";
    case "walkB":
      return "walk_b";
    case "standing":
      return "standing";
    case "settled":
    case "authenticating":
      return "laptop";
    case "success":
      return "success";
    case "exiting":
      return "exit";
  }
}

export function loginStoryMotion(stage: LoginStoryStage): string {
  if (stage === "walkA" || stage === "walkB") return "walking";
  return stage;
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
  if (presentation === "male") return LOGIN_STORY_MALE_FRAMES[pose];
  if (pose === "walk_a" || pose === "walk_b" || pose === "standing") {
    return `/login/story/${presentation}-enter.png`;
  }
  if (pose === "laptop") return `/login/story/${presentation}-laptop.png`;
  if (pose === "success") return `/login/story/${presentation}-success.png`;
  return `/login/story/${presentation}-exit.png`;
}

export function loginStoryFrameSrcs(
  presentation: LoginPresentationId
): string[] {
  return LOGIN_STORY_POSES.map((pose) => resolveLoginStorySrc(presentation, pose));
}

export function isLoginStoryCutout(src: string): boolean {
  return /\/login\/story\/0[1-6]_/.test(src);
}

export function nextLoginStoryStage(
  stage: LoginStoryStage,
  event: "tick" | "submit" | "success" | "fail" | "reduce" | "replay"
): LoginStoryStage {
  if (event === "reduce") return "settled";
  if (event === "replay") {
    return stage === "settled" ? "walkA" : stage;
  }
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
  if (stage === "intro") return "walkA";
  if (stage === "walkA") return "walkB";
  if (stage === "walkB") return "standing";
  if (stage === "standing") return "settled";
  if (stage === "success") return "exiting";
  return stage;
}
