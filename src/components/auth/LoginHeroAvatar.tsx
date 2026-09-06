"use client";

import { useEffect, useState } from "react";

/**
 * Login stage uses local cinematic stills or WebM clips — never geometric presets.
 * Presentation and pose switches crossfade in place so the stage does not jump.
 */
export function LoginHeroAvatar({
  name,
  src,
  hidden = false,
}: {
  name: string;
  src: string;
  hidden?: boolean;
}) {
  const [shown, setShown] = useState(src);
  const [outgoing, setOutgoing] = useState<string | null>(null);
  const isVideo = src.endsWith(".webm") || shown.endsWith(".webm");

  if (!hidden && src !== shown) {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOutgoing(reduced ? null : shown);
    setShown(src);
  }

  useEffect(() => {
    if (!outgoing) return;
    const timer = window.setTimeout(() => setOutgoing(null), 420);
    return () => window.clearTimeout(timer);
  }, [outgoing]);

  return (
    <figure className={`login-hero-figure${hidden ? " is-hidden" : ""}`}>
      {outgoing ? (
        outgoing.endsWith(".webm") ? (
          <video
            className="login-hero-photo is-exit"
            src={outgoing}
            muted
            playsInline
            autoPlay
            loop
            aria-hidden
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={outgoing}
            alt=""
            className="login-hero-photo is-exit"
            width={768}
            height={1024}
            decoding="async"
          />
        )
      ) : null}
      {isVideo && shown.endsWith(".webm") ? (
        <video
          className={`login-hero-photo${outgoing ? " is-enter" : ""}`}
          src={shown}
          muted
          playsInline
          autoPlay
          loop
          aria-hidden
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={shown}
          alt=""
          className={`login-hero-photo${outgoing ? " is-enter" : ""}`}
          width={768}
          height={1024}
          decoding="async"
        />
      )}
      <figcaption className="sr-only">{name}</figcaption>
    </figure>
  );
}
