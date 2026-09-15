import type { LanguageCode } from '../types';

// Human-readable names shown in the UI.
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Español',
};

// BCP-47 locale tags, used by react-native-tts to pick a system voice.
export const TTS_LOCALE: Record<LanguageCode, string> = {
  en: 'en-US',
  es: 'es-ES',
};

export function otherLanguage(lang: LanguageCode): LanguageCode {
  return lang === 'en' ? 'es' : 'en';
}
