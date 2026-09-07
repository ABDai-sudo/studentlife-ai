import type { LoginPresentationId } from "@/lib/avatar/login-preview";

/** Static laptop hero art per presentation — no cinematic stage machine. */
export const LOGIN_HERO_ARTWORK: Record<LoginPresentationId, string> = {
  male: "/login/story/04_laptop_pose.png",
  female: "/login/story/female-laptop.png",
  neutral: "/login/story/neutral-laptop.png",
  custom: "/login/story/custom-laptop.png",
};

export function resolveLoginHeroSrc(presentation: LoginPresentationId): string {
  return LOGIN_HERO_ARTWORK[presentation];
}

export function isLoginStoryCutout(src: string): boolean {
  return /\/login\/story\/0[1-6]_/.test(src);
}
