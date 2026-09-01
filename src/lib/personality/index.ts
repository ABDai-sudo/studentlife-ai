import { copyByMode, type NavCopyKey, type PersonalityCopy } from "./copy";
import {
  PERSONALITY_MODES,
  type PersonalityMode,
  THEME_MODES,
  type ThemeMode,
} from "./types";

export {
  PERSONALITY_MODES,
  THEME_MODES,
  type PersonalityMode,
  type ThemeMode,
};
export {
  seriousCopy,
  copyByMode,
  moneyAssistantQuickActions,
  type NavCopyKey,
  type PersonalityCopy,
  type MoneyAssistantCopy,
  type MoneyAssistantQuickAction,
} from "./copy";

export function getCopy(mode: PersonalityMode): PersonalityCopy {
  return copyByMode[mode] ?? copyByMode.PROFESSIONAL;
}

export function navLabel(mode: PersonalityMode, key: NavCopyKey): string {
  return getCopy(mode).nav[key];
}

export function getMoneyAssistantCopy(mode: PersonalityMode) {
  return getCopy(mode).moneyAssistant;
}
