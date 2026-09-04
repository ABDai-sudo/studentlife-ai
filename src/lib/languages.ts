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
  PROFESSIONAL: "Professional — clear and formal",
  FRIENDLY: "Friendly — warm and supportive",
  CAMPUS_BRO: "Campus Bro — casual campus tone",
  CHRONICALLY_ONLINE:
    "Chronically Online — Internet-native, playful student tone",
  ACADEMIC_VILLAIN: "Academic Villain — dramatic study energy",
};

/** Short vibe names for the premium indicator near UI language. */
export const PERSONALITY_SHORT_LABELS: Record<string, string> = {
  PROFESSIONAL: "Professional",
  FRIENDLY: "Friendly",
  CAMPUS_BRO: "Campus Bro",
  CHRONICALLY_ONLINE: "Chronically Online",
  ACADEMIC_VILLAIN: "Academic Villain",
};

/** One-line vibe descriptions (not languages). */
export const PERSONALITY_BLURBS: Record<string, string> = {
  PROFESSIONAL: "Clear and formal",
  FRIENDLY: "Warm and supportive",
  CAMPUS_BRO: "Casual campus tone",
  CHRONICALLY_ONLINE: "Internet-native, playful student tone",
  ACADEMIC_VILLAIN: "Dramatic study energy",
};
