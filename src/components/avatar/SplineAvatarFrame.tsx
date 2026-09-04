"use client";

import { useEffect, useState } from "react";
import {
  isAllowedAvatarSceneUrl,
  resolveAvatarSceneUrl,
} from "@/lib/avatar/scene-url";

export function SplineAvatarFrame({
  sceneUrl,
  onReady,
  onError,
}: {
  sceneUrl: string;
  onReady: () => void;
  onError: () => void;
}) {
  const allowed = isAllowedAvatarSceneUrl(sceneUrl);
  const localScene = allowed && sceneUrl.startsWith("/avatar/");
  const [timedOut, setTimedOut] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed || loaded) return;
    const timer = window.setTimeout(() => {
      setTimedOut(true);
      onError();
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [allowed, loaded, onError]);

  useEffect(() => {
    if (!localScene) return;
    let live = true;
    fetch(sceneUrl, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error("scene");
        return res.text();
      })
      .then((html) => {
        if (live) setSrcDoc(html);
      })
      .catch(() => {
        if (live) onError();
      });
    return () => {
      live = false;
    };
  }, [localScene, sceneUrl, onError]);

  if (!allowed || timedOut) return null;
  if (localScene && !srcDoc) return null;

  return (
    <iframe
      title=""
      src={localScene ? undefined : sceneUrl}
      srcDoc={localScene ? srcDoc ?? undefined : undefined}
      className="avatar-spline-frame"
      loading="lazy"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin"
      onError={onError}
      onLoad={() => {
        setLoaded(true);
        onReady();
      }}
      aria-hidden
      data-avatar-scene={sceneUrl}
    />
  );
}

export function splineSceneFromEnv(): string | null {
  return resolveAvatarSceneUrl(process.env.NEXT_PUBLIC_AVATAR_SPLINE_SCENE);
}
