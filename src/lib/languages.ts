import {
  EXPLANATION_LANGUAGE_NAMES,
  READY_UI_LANGUAGE_NAMES,
} from "@/lib/i18n/languages-registry";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import type { PersonalityMode } from "@/lib/personality";

/**
 * Explanation languages for AI Tutor / coaches.
 * Expanded internationally — does not require a UI dictionary.
 */
export const EXPLANATION_LANGUAGES = EXPLANATION_LANGUAGE_NAMES;

/**
 * Ready UI languages only (full chrome dictionaries).
 * Planned languages appear in the searchable picker but are not selectable.
 */
export const UI_LANGUAGES = READY_UI_LANGUAGE_NAMES;

export const PERSONALITY_I18N_KEYS: Record<PersonalityMode, MessageKey> = {
  PROFESSIONAL: "personality.professional",
  FRIENDLY: "personality.friendly",
  CAMPUS_BRO: "personality.campusBro",
  CHRONICALLY_ONLINE: "personality.chronicallyOnline",
  ACADEMIC_VILLAIN: "personality.academicVillain",
};

/** Full personality option labels (settings select). */
export const PERSONALITY_LABELS: Record<string, string> = {
  PROFESSIONAL: "Normal — clear and balanced",
  FRIENDLY: "Tutor — step-by-step teaching",
  CAMPUS_BRO: "Casual — natural student talk",
  CHRONICALLY_ONLINE: "Casual (extra)",
  ACADEMIC_VILLAIN: "Exam — concise, high-signal answers",
};

/** Short vibe names for the premium indicator near UI language. */
export const PERSONALITY_SHORT_LABELS: Record<string, string> = {
  PROFESSIONAL: "Normal",
  FRIENDLY: "Tutor",
  CAMPUS_BRO: "Casual",
  CHRONICALLY_ONLINE: "Casual",
  ACADEMIC_VILLAIN: "Exam",
};

/** One-line vibe descriptions (not languages). */
export const PERSONALITY_BLURBS: Record<string, string> = {
  PROFESSIONAL: "Clear, friendly, balanced default",
  FRIENDLY: "Teaches step-by-step with examples",
  CAMPUS_BRO: "Natural casual language",
  CHRONICALLY_ONLINE: "Natural casual language",
  ACADEMIC_VILLAIN: "Concise exam-ready answers",
};
