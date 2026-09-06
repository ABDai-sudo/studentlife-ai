"use client";

import { useEffect, useState } from "react";

/**
 * Login stage uses local cinematic stills — never geometric preset circles.
 * Presentation switches crossfade in place so the stage does not jump.
 */
export function LoginHeroAvatar({
  name,
  src,
}: {
  name: string;
  src: string;
}) {
  const [shown, setShown] = useState(src);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  if (src !== shown) {
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
    <figure className="login-hero-figure">
      {outgoing ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={outgoing}
          alt=""
          className="login-hero-photo is-exit"
          width={768}
          height={1024}
          decoding="async"
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shown}
        alt=""
        className={`login-hero-photo${outgoing ? " is-enter" : ""}`}
        width={768}
        height={1024}
        decoding="async"
      />
      <figcaption className="sr-only">{name}</figcaption>
    </figure>
  );
}
