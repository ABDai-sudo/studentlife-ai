"use client";

/**
 * Login stage uses local cinematic stills — never geometric preset circles.
 */
export function LoginHeroAvatar({
  name,
  src,
}: {
  name: string;
  src: string;
}) {
  return (
    <figure className="login-hero-figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="login-hero-photo"
        width={768}
        height={1024}
        decoding="async"
      />
      <figcaption className="sr-only">{name}</figcaption>
    </figure>
  );
}
