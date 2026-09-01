export const PERSONALITY_MODES = [
  "PROFESSIONAL",
  "FRIENDLY",
  "CAMPUS_BRO",
  "CHRONICALLY_ONLINE",
  "ACADEMIC_VILLAIN",
] as const;

export type PersonalityMode = (typeof PERSONALITY_MODES)[number];

export const THEME_MODES = ["LIGHT", "DARK", "SYSTEM"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
