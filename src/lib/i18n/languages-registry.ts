/**
 * Scalable UI / explanation language registry.
 *
 * `ready`  — full UI dictionary exists under dictionaries/; selectable as
 *            Preferred UI Language. ONLY mark ready when a real dictionary ships.
 * `planned` — listed for international students; Coming soon in the UI picker.
 *             May still be used as Explanation Language for AI output.
 *
 * Truth rule: never mark a language `ready` without a usable translation file
 * wired in translator.ts. Silent English UI for a “supported” language is a bug.
 */

export type LanguageStatus = "ready" | "planned";

export type ScriptFamily =
  | "latin"
  | "devanagari"
  | "gujarati"
  | "arabic"
  | "bengali"
  | "gurmukhi"
  | "tamil"
  | "telugu"
  | "kannada"
  | "malayalam"
  | "thai"
  | "chinese"
  | "japanese"
  | "korean"
  | "cyrillic";

export type LanguageDefinition = {
  /** Stable machine code (BCP47 primary where possible). */
  code: string;
  /** English display name stored in profile / Settings. */
  englishName: string;
  /** Native endonym shown in the selector. */
  nativeName: string;
  /** BCP47 tag for <html lang>. */
  bcp47: string;
  dir: "ltr" | "rtl";
  script: ScriptFamily;
  /** UI chrome translation status. */
  uiStatus: LanguageStatus;
  /** Whether AI explanation language may use this name. */
  explanationSupported: boolean;
  /** Search aliases (lowercase). */
  aliases?: readonly string[];
};

/**
 * Ordered for students internationally. Ready languages first in UI lists
 * is handled by helpers — keep human-friendly regional grouping here.
 */
export const LANGUAGE_REGISTRY: readonly LanguageDefinition[] = [
  // —— Ready UI dictionaries ——
  {
    code: "en",
    englishName: "English",
    nativeName: "English",
    bcp47: "en",
    dir: "ltr",
    script: "latin",
    uiStatus: "ready",
    explanationSupported: true,
  },
  {
    code: "hi",
    englishName: "Hindi",
    nativeName: "हिन्दी",
    bcp47: "hi",
    dir: "ltr",
    script: "devanagari",
    uiStatus: "ready",
    explanationSupported: true,
    aliases: ["हिंदी"],
  },
  {
    code: "gu",
    englishName: "Gujarati",
    nativeName: "ગુજરાતી",
    bcp47: "gu",
    dir: "ltr",
    script: "gujarati",
    uiStatus: "ready",
    explanationSupported: true,
  },

  // —— South Asia (planned UI) ——
  {
    code: "ur",
    englishName: "Urdu",
    nativeName: "اردو",
    bcp47: "ur",
    dir: "rtl",
    script: "arabic",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "bn",
    englishName: "Bengali",
    nativeName: "বাংলা",
    bcp47: "bn",
    dir: "ltr",
    script: "bengali",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "mr",
    englishName: "Marathi",
    nativeName: "मराठी",
    bcp47: "mr",
    dir: "ltr",
    script: "devanagari",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "ta",
    englishName: "Tamil",
    nativeName: "தமிழ்",
    bcp47: "ta",
    dir: "ltr",
    script: "tamil",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "te",
    englishName: "Telugu",
    nativeName: "తెలుగు",
    bcp47: "te",
    dir: "ltr",
    script: "telugu",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "kn",
    englishName: "Kannada",
    nativeName: "ಕನ್ನಡ",
    bcp47: "kn",
    dir: "ltr",
    script: "kannada",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "ml",
    englishName: "Malayalam",
    nativeName: "മലയാളം",
    bcp47: "ml",
    dir: "ltr",
    script: "malayalam",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "pa",
    englishName: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    bcp47: "pa",
    dir: "ltr",
    script: "gurmukhi",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "ne",
    englishName: "Nepali",
    nativeName: "नेपाली",
    bcp47: "ne",
    dir: "ltr",
    script: "devanagari",
    uiStatus: "planned",
    explanationSupported: true,
  },

  // —— Middle East / North Africa ——
  {
    code: "ar",
    englishName: "Arabic",
    nativeName: "العربية",
    bcp47: "ar",
    dir: "rtl",
    script: "arabic",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "fa",
    englishName: "Persian",
    nativeName: "فارسی",
    bcp47: "fa",
    dir: "rtl",
    script: "arabic",
    uiStatus: "planned",
    explanationSupported: true,
    aliases: ["farsi", "persian / farsi"],
  },

  // —— Europe ——
  {
    code: "es",
    englishName: "Spanish",
    nativeName: "Español",
    bcp47: "es",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "fr",
    englishName: "French",
    nativeName: "Français",
    bcp47: "fr",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "de",
    englishName: "German",
    nativeName: "Deutsch",
    bcp47: "de",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "pt",
    englishName: "Portuguese",
    nativeName: "Português",
    bcp47: "pt",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "it",
    englishName: "Italian",
    nativeName: "Italiano",
    bcp47: "it",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "nl",
    englishName: "Dutch",
    nativeName: "Nederlands",
    bcp47: "nl",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "ru",
    englishName: "Russian",
    nativeName: "Русский",
    bcp47: "ru",
    dir: "ltr",
    script: "cyrillic",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "uk",
    englishName: "Ukrainian",
    nativeName: "Українська",
    bcp47: "uk",
    dir: "ltr",
    script: "cyrillic",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "tr",
    englishName: "Turkish",
    nativeName: "Türkçe",
    bcp47: "tr",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "pl",
    englishName: "Polish",
    nativeName: "Polski",
    bcp47: "pl",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },

  // —— SE Asia ——
  {
    code: "id",
    englishName: "Indonesian",
    nativeName: "Bahasa Indonesia",
    bcp47: "id",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "ms",
    englishName: "Malay",
    nativeName: "Bahasa Melayu",
    bcp47: "ms",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "vi",
    englishName: "Vietnamese",
    nativeName: "Tiếng Việt",
    bcp47: "vi",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "th",
    englishName: "Thai",
    nativeName: "ไทย",
    bcp47: "th",
    dir: "ltr",
    script: "thai",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "fil",
    englishName: "Filipino",
    nativeName: "Filipino",
    bcp47: "fil",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
    aliases: ["tagalog"],
  },

  // —— East Asia ——
  {
    code: "zh-Hans",
    englishName: "Chinese (Simplified)",
    nativeName: "简体中文",
    bcp47: "zh-Hans",
    dir: "ltr",
    script: "chinese",
    uiStatus: "planned",
    explanationSupported: true,
    aliases: ["chinese", "mandarin", "zh-cn"],
  },
  {
    code: "zh-Hant",
    englishName: "Chinese (Traditional)",
    nativeName: "繁體中文",
    bcp47: "zh-Hant",
    dir: "ltr",
    script: "chinese",
    uiStatus: "planned",
    explanationSupported: true,
    aliases: ["zh-tw", "zh-hk"],
  },
  {
    code: "ja",
    englishName: "Japanese",
    nativeName: "日本語",
    bcp47: "ja",
    dir: "ltr",
    script: "japanese",
    uiStatus: "planned",
    explanationSupported: true,
  },
  {
    code: "ko",
    englishName: "Korean",
    nativeName: "한국어",
    bcp47: "ko",
    dir: "ltr",
    script: "korean",
    uiStatus: "planned",
    explanationSupported: true,
  },

  // —— Explanation-only hybrid (not a UI locale) ——
  {
    code: "hinglish",
    englishName: "Hinglish",
    nativeName: "Hinglish",
    bcp47: "en",
    dir: "ltr",
    script: "latin",
    uiStatus: "planned",
    explanationSupported: true,
    aliases: ["hindi english"],
  },
] as const;

const byEnglish = new Map(
  LANGUAGE_REGISTRY.map((l) => [l.englishName.toLowerCase(), l])
);
const byCode = new Map(LANGUAGE_REGISTRY.map((l) => [l.code.toLowerCase(), l]));

export function getLanguageByEnglishName(
  name: string | null | undefined
): LanguageDefinition | undefined {
  if (!name) return undefined;
  const trimmed = name.trim().toLowerCase();
  const direct = byEnglish.get(trimmed);
  if (direct) return direct;
  for (const lang of LANGUAGE_REGISTRY) {
    if (lang.aliases?.some((a) => a.toLowerCase() === trimmed)) return lang;
    if (lang.nativeName === name.trim()) return lang;
    if (lang.code.toLowerCase() === trimmed) return lang;
  }
  return undefined;
}

export function getLanguageByCode(
  code: string | null | undefined
): LanguageDefinition | undefined {
  if (!code) return undefined;
  return byCode.get(code.toLowerCase());
}

/** Languages with a complete UI dictionary — only these may drive chrome. */
export function getReadyUiLanguages(): LanguageDefinition[] {
  return LANGUAGE_REGISTRY.filter((l) => l.uiStatus === "ready");
}

/** All languages shown in the UI language picker (ready + planned). */
export function getUiLanguagePickerList(): LanguageDefinition[] {
  return LANGUAGE_REGISTRY.filter((l) => l.code !== "hinglish");
}

/** Languages AI Tutor / coaches may use for explanations. */
export function getExplanationLanguages(): LanguageDefinition[] {
  return LANGUAGE_REGISTRY.filter((l) => l.explanationSupported);
}

export function isReadyUiLanguageName(name: string): boolean {
  const lang = getLanguageByEnglishName(name);
  return lang?.uiStatus === "ready";
}

export function isRtlLanguageCode(code: string): boolean {
  return getLanguageByCode(code)?.dir === "rtl";
}

export function filterLanguages(
  list: readonly LanguageDefinition[],
  query: string
): LanguageDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...list];
  return list.filter((l) => {
    const hay = [
      l.englishName,
      l.nativeName,
      l.code,
      ...(l.aliases ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/** English names for ready UI locales (profile persistence). */
export const READY_UI_LANGUAGE_NAMES = getReadyUiLanguages().map(
  (l) => l.englishName
) as readonly string[];

/** English names for explanation language selects. */
export const EXPLANATION_LANGUAGE_NAMES = getExplanationLanguages().map(
  (l) => l.englishName
) as readonly string[];
