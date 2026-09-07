"use client";

import { useEffect, useRef, useState } from "react";
import {
  loginStoryTiming,
  nextLoginStoryStage,
  type LoginStoryStage,
} from "@/lib/avatar/login-story";

const COMPACT_QUERY = "(max-width: 767px)";
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function readMedia(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

function preloadImages(srcs: string[]): Promise<void> {
  return Promise.all(
    srcs.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    )
  ).then(() => undefined);
}

export function useLoginStory(frameSrcs: string[]): {
  stage: LoginStoryStage;
  compact: boolean;
  reduced: boolean;
  preloaded: boolean;
  storyRun: number;
  onSubmitStart: () => void;
  onAuthSuccess: () => void;
  onAuthFail: () => void;
  restartEnter: () => void;
  pauseIdleReplay: () => void;
} {
  const [compact, setCompact] = useState(() => readMedia(COMPACT_QUERY));
  const [reduced, setReduced] = useState(() => readMedia(REDUCE_QUERY));
  const [readyKey, setReadyKey] = useState(() =>
    readMedia(REDUCE_QUERY) ? frameSrcs.join("|") : ""
  );
  const [stage, setStage] = useState<LoginStoryStage>(() =>
    readMedia(REDUCE_QUERY) ? "settled" : "intro"
  );
  const [storyRun, setStoryRun] = useState(0);
  const [idlePaused, setIdlePaused] = useState(false);
  const framesKey = frameSrcs.join("|");
  const preloaded = reduced || readyKey === framesKey;
  const loadGen = useRef(0);

  useEffect(() => {
    const compactMq = window.matchMedia(COMPACT_QUERY);
    const reduceMq = window.matchMedia(REDUCE_QUERY);
    const onCompact = () => setCompact(compactMq.matches);
    const onReduce = () => {
      const isReduced = reduceMq.matches;
      setReduced(isReduced);
      if (isReduced) {
        setReadyKey(framesKey);
        setStage("settled");
      }
    };
    compactMq.addEventListener("change", onCompact);
    reduceMq.addEventListener("change", onReduce);
    return () => {
      compactMq.removeEventListener("change", onCompact);
      reduceMq.removeEventListener("change", onReduce);
    };
  }, [framesKey]);

  useEffect(() => {
    if (reduced) {
      return;
    }
    const gen = ++loadGen.current;
    void preloadImages(framesKey.split("|").filter(Boolean)).then(() => {
      if (loadGen.current === gen) setReadyKey(framesKey);
    });
  }, [framesKey, reduced]);

  useEffect(() => {
    if (reduced || !preloaded) return;
    const timing = loginStoryTiming(compact);
    const delay =
      stage === "intro"
        ? timing.introMs
        : stage === "walkA"
          ? timing.walkHoldMs
          : stage === "walkB"
            ? timing.walkCrossfadeMs
            : stage === "standing"
              ? timing.standingMs
              : stage === "success"
                ? timing.successMs
                : stage === "settled" && !idlePaused
                  ? timing.idleReplayMs
                  : 0;
    if (!delay) return;
    const timer = window.setTimeout(() => {
      if (stage === "settled" && !idlePaused) {
        setStoryRun((n) => n + 1);
        setStage((current) => nextLoginStoryStage(current, "replay"));
        return;
      }
      setStage((current) => nextLoginStoryStage(current, "tick"));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [stage, compact, reduced, preloaded, idlePaused]);

  function onSubmitStart() {
    setIdlePaused(true);
    setStage((current) => nextLoginStoryStage(current, "submit"));
  }

  function onAuthSuccess() {
    setIdlePaused(true);
    if (readMedia(REDUCE_QUERY)) {
      setStage("settled");
      return;
    }
    setStage("success");
  }

  function onAuthFail() {
    setIdlePaused(false);
    setStage((current) => nextLoginStoryStage(current, "fail"));
  }

  function restartEnter() {
    if (reduced) {
      setStage("settled");
      return;
    }
    setIdlePaused(false);
    setStoryRun((n) => n + 1);
    setStage((current) => {
      if (current === "success" || current === "exiting" || current === "authenticating") {
        return current;
      }
      return "intro";
    });
  }

  function pauseIdleReplay() {
    setIdlePaused(true);
  }

  return {
    stage,
    compact,
    reduced,
    preloaded,
    storyRun,
    onSubmitStart,
    onAuthSuccess,
    onAuthFail,
    restartEnter,
    pauseIdleReplay,
  };
}
