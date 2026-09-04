"use client";

import { Avatar } from "@/components/ui/Avatar";

/**
 * Login uses the existing Avatar presets immediately.
 * Optional 3D stays off this page so the form never waits on Spline
 * and the entry identity stays mature rather than a test sphere.
 */
export function LoginHeroAvatar({
  name,
  presetId,
}: {
  name: string;
  presetId: string | null;
}) {
  return <Avatar name={name} presetId={presetId} size="hero" />;
}
