export const UI_LOCALE_CODES = ["en", "hi", "gu"] as const;

export type UiLocale = (typeof UI_LOCALE_CODES)[number];

export type MessageParams = Record<string, string | number>;

/** Flat dictionary shape — every locale must implement the same keys. */
export type MessageDictionary = Record<string, string>;
