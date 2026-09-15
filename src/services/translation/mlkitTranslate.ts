import TranslateText, { TranslateLanguage } from '@react-native-ml-kit/translate-text';
import type { LanguageCode } from '../../types';

// Maps our simple 'en' | 'es' codes to ML Kit's language enum.
const LANGUAGE_MAP: Record<LanguageCode, TranslateLanguage> = {
  en: TranslateLanguage.ENGLISH,
  es: TranslateLanguage.SPANISH,
};

/**
 * Translates text fully on-device via Google ML Kit.
 *
 * `downloadModelIfNeeded: true` means the first call for a given
 * language pair will fetch a small (~30MB) model over the network
 * and cache it. Every call after that — including with airplane
 * mode on — runs with zero network access.
 */
export async function translateText(
  text: string,
  from: LanguageCode,
  to: LanguageCode,
): Promise<string> {
  if (!text.trim()) return '';

  const translated = await TranslateText.translate({
    text,
    sourceLanguage: LANGUAGE_MAP[from],
    targetLanguage: LANGUAGE_MAP[to],
    downloadModelIfNeeded: true,
  });

  return translated;
}
