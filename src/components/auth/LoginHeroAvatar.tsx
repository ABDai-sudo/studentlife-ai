"use client";

import { useEffect, useState } from "react";
import { isLoginStoryCutout } from "@/lib/avatar/login-story";

/**
 * Login stage uses local cinematic stills — never geometric presets.
 * Pose switches crossfade in place on a shared bottom-center anchor.
 */
export function LoginHeroAvatar({
  name,
  src,
  hidden = false,
  cutout = false,
  crossfadeMs = 120,
}: {
  name: string;
  src: string;
  hidden?: boolean;
  cutout?: boolean;
  crossfadeMs?: number;
}) {
  const [shown, setShown] = useState(src);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  if (!hidden && src !== shown) {
    // Instant swap for fast flipbook steps — crossfade only when long enough to see.
    const useCrossfade =
      crossfadeMs >= 100 &&
      !(
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    setOutgoing(useCrossfade ? shown : null);
    setShown(src);
  }

  useEffect(() => {
    if (!outgoing) return;
    const timer = window.setTimeout(() => setOutgoing(null), crossfadeMs);
    return () => window.clearTimeout(timer);
  }, [outgoing, crossfadeMs]);

  function photoClassFor(photoSrc: string) {
    const isCutout = cutout || isLoginStoryCutout(photoSrc);
    return `login-hero-photo${isCutout ? " is-cutout" : " is-plate"}`;
  }

  return (
    <figure className={`login-hero-figure${hidden ? " is-hidden" : ""}`}>
      {outgoing ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={outgoing}
          alt=""
          className={`${photoClassFor(outgoing)} is-exit`}
          width={1122}
          height={1402}
          decoding="async"
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shown}
        alt=""
        className={`${photoClassFor(shown)}${outgoing ? " is-enter" : ""}`}
        width={1122}
        height={1402}
        decoding="async"
      />
      <figcaption className="sr-only">{name}</figcaption>
    </figure>
  );
}
