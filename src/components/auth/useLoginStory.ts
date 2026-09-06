"use client";

import { useEffect, useState } from "react";
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

export function useLoginStory(): {
  stage: LoginStoryStage;
  compact: boolean;
  reduced: boolean;
  onSubmitStart: () => void;
  onAuthSuccess: () => void;
  onAuthFail: () => void;
  restartEnter: () => void;
} {
  const [compact, setCompact] = useState(() => readMedia(COMPACT_QUERY));
  const [reduced, setReduced] = useState(() => readMedia(REDUCE_QUERY));
  const [stage, setStage] = useState<LoginStoryStage>(() =>
    readMedia(REDUCE_QUERY) ? "settled" : "intro"
  );

  useEffect(() => {
    const compactMq = window.matchMedia(COMPACT_QUERY);
    const reduceMq = window.matchMedia(REDUCE_QUERY);
    const onCompact = () => setCompact(compactMq.matches);
    const onReduce = () => {
      const isReduced = reduceMq.matches;
      setReduced(isReduced);
      if (isReduced) setStage("settled");
    };
    compactMq.addEventListener("change", onCompact);
    reduceMq.addEventListener("change", onReduce);
    return () => {
      compactMq.removeEventListener("change", onCompact);
      reduceMq.removeEventListener("change", onReduce);
    };
  }, []);

  useEffect(() => {
    if (reduced) return;
    const timing = loginStoryTiming(compact);
    const delay =
      stage === "intro"
        ? timing.introMs
        : stage === "entering"
          ? timing.enteringMs
          : stage === "success"
            ? timing.successMs
            : 0;
    if (!delay) return;
    const timer = window.setTimeout(() => {
      setStage((current) => nextLoginStoryStage(current, "tick"));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [stage, compact, reduced]);

  function onSubmitStart() {
    setStage((current) => nextLoginStoryStage(current, "submit"));
  }

  function onAuthSuccess() {
    if (readMedia(REDUCE_QUERY)) {
      setStage("settled");
      return;
    }
    setStage("success");
  }

  function onAuthFail() {
    setStage((current) => nextLoginStoryStage(current, "fail"));
  }

  function restartEnter() {
    if (reduced) {
      setStage("settled");
      return;
    }
    setStage((current) => {
      if (current === "success" || current === "exiting" || current === "authenticating") {
        return current;
      }
      return "entering";
    });
  }

  return {
    stage,
    compact,
    reduced,
    onSubmitStart,
    onAuthSuccess,
    onAuthFail,
    restartEnter,
  };
}
