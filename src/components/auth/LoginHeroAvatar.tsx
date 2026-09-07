"use client";

import { isLoginStoryCutout } from "@/lib/avatar/login-story";

/** Static login hero still — presentation swaps update the image in place. */
export function LoginHeroAvatar({
  name,
  src,
  cutout = false,
}: {
  name: string;
  src: string;
  cutout?: boolean;
}) {
  const isCutout = cutout || isLoginStoryCutout(src);
  const photoClass = `login-hero-photo${isCutout ? " is-cutout" : " is-plate"}`;

  return (
    <figure className="login-hero-figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={photoClass}
        width={1122}
        height={1402}
        decoding="async"
      />
      <figcaption className="sr-only">{name}</figcaption>
    </figure>
  );
}
