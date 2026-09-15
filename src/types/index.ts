export type LanguageCode = 'en' | 'es';

export interface TranslationEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  createdAt: number;
}

export interface TranscriptSegment {
  text: string;
  startSec: number;
  endSec: number;
}

export interface TranscriptResult {
  text: string;
  segments: TranscriptSegment[];
}

export type SetupStep =
  | 'idle'
  | 'translation-models'
  | 'speech-model'
  | 'done';
