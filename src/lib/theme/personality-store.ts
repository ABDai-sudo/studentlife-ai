import type { PersonalityMode } from "@/lib/personality";

const PERSONALITY_CHANGE_EVENT = "sl-personality-change";

let currentPersonality: PersonalityMode = "PROFESSIONAL";
let hasClientValue = false;

export function getPersonalitySnapshot(
  fallback: PersonalityMode
): PersonalityMode {
  return hasClientValue ? currentPersonality : fallback;
}

export function getServerPersonalitySnapshot(
  fallback: PersonalityMode
): PersonalityMode {
  return fallback;
}

export function setPersonalityStore(mode: PersonalityMode): void {
  currentPersonality = mode;
  hasClientValue = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PERSONALITY_CHANGE_EVENT));
  }
}

export function subscribePersonalityStore(
  onStoreChange: () => void
): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(PERSONALITY_CHANGE_EVENT, onStoreChange);
  return () =>
    window.removeEventListener(PERSONALITY_CHANGE_EVENT, onStoreChange);
}
