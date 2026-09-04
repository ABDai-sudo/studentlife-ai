"use client";

import { useCallback, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { SplineAvatarFrame, splineSceneFromEnv } from "@/components/avatar/SplineAvatarFrame";
import { usePrefersReducedMotion } from "@/components/avatar/usePrefersReducedMotion";
import type { AvatarPresence } from "@/lib/avatar/contextual-status";

type DynamicAvatarProps = {
  name: string;
  presetId?: string | null;
  imageSrc?: string | null;
  frame?: "none" | "streak" | "achievement" | "crown";
  presence?: AvatarPresence | null;
  size?: "xl" | "2xl";
  /** DEV: skip 3D even if a scene URL exists. */
  forceStatic?: boolean;
  /** DEV: pretend the optional 3D layer failed. */
  force3dFailure?: boolean;
};

/**
 * Instant static avatar, with an optional lazy 3D iframe on top.
 * Production loads 3D only when NEXT_PUBLIC_AVATAR_SPLINE_SCENE is a spline.design URL.
 * Development falls back to the local /avatar/dev-scene.html test scene.
 * Failure, reduced motion, and a missing production URL keep the existing image.
 */
export function DynamicAvatar({
  name,
  presetId,
  imageSrc,
  frame = "none",
  presence = "idle",
  size = "2xl",
  forceStatic = false,
  force3dFailure = false,
}: DynamicAvatarProps) {
  const reducedMotion = usePrefersReducedMotion();
  const sceneUrl = splineSceneFromEnv();
  const [splineFailed, setSplineFailed] = useState(false);
  const [splineReady, setSplineReady] = useState(false);

  const onError = useCallback(() => {
    setSplineFailed(true);
    setSplineReady(false);
  }, []);
  const onReady = useCallback(() => {
    setSplineReady(true);
  }, []);

  const trySpline =
    Boolean(sceneUrl) &&
    !forceStatic &&
    !force3dFailure &&
    !reducedMotion &&
    !splineFailed;

  const layer = force3dFailure || splineFailed
    ? "failed"
    : !trySpline
      ? "off"
      : splineReady
        ? "ready"
        : "loading";

  return (
    <span
      className={`avatar-viewport${
        !reducedMotion && !forceStatic ? " avatar-viewport-live" : ""
      }${splineReady ? " avatar-viewport-spline-ready" : ""}`}
      data-avatar-3d={layer}
      aria-busy={layer === "loading"}
    >
      <Avatar
        name={name}
        size={size}
        presetId={presetId}
        imageSrc={imageSrc}
        frame={frame}
        presence={presence}
      />
      {layer === "loading" ? (
        <span className="sr-only">Loading 3D avatar</span>
      ) : null}
      {layer === "failed" ? (
        <span className="sr-only">3D avatar unavailable, showing image</span>
      ) : null}
      {trySpline && sceneUrl ? (
        <SplineAvatarFrame
          sceneUrl={sceneUrl}
          onReady={onReady}
          onError={onError}
        />
      ) : null}
    </span>
  );
}
