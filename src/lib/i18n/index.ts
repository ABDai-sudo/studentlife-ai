export type { UiLocale, MessageParams, MessageDictionary } from "./types";
export type { MessageKey, EnMessages } from "./dictionaries/en";
export {
  UI_LANGUAGE_NAMES,
  LANGUAGE_TO_LOCALE,
  LOCALE_TO_LANGUAGE,
  LOCALE_BCP47,
  localeDirection,
  isUiLocale,
  languageNameToLocale,
  localeToLanguageName,
  detectBrowserUiLocale,
} from "./config";
export type { UiLanguageName } from "./config";
export { t, getDictionary } from "./translator";
export {
  UI_LOCALE_KEY,
  getUiLocaleSnapshot,
  getServerUiLocaleSnapshot,
  writeUiLocale,
  writeUiLocaleFromLanguageName,
  hydrateUiLocaleFromProfile,
  getUiLanguageNameSnapshot,
  subscribeUiLocale,
  setServerPreferredUiLanguage,
} from "./locale-store";
export { formatDate, formatNumber, formatCurrency, pluralize } from "./format";
export { auditMissingTranslations, logTranslationAudit } from "./dev-audit";
export {
  LANGUAGE_REGISTRY,
  getReadyUiLanguages,
  getUiLanguagePickerList,
  getExplanationLanguages,
  isReadyUiLanguageName,
  filterLanguages,
} from "./languages-registry";
export type {
  LanguageDefinition,
  LanguageStatus,
} from "./languages-registry";
