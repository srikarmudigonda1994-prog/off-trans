import Tts from 'react-native-tts';
import { TTS_LOCALE } from '../../constants/languages';
import type { LanguageCode } from '../../types';

let initialized = false;

/**
 * react-native-tts wraps AVSpeechSynthesizer on iOS and the built-in
 * Android TextToSpeech engine — both are already on the device and
 * already offline, so there's no model to bundle or download here.
 */
export async function initTts(): Promise<void> {
  if (initialized) return;
  await Tts.getInitStatus();
  initialized = true;
}

export async function speak(text: string, language: LanguageCode): Promise<void> {
  if (!text.trim()) return;
  await initTts();
  await Tts.setDefaultLanguage(TTS_LOCALE[language]);
  Tts.stop();
  Tts.speak(text);
}

export function stopSpeaking(): void {
  Tts.stop();
}
