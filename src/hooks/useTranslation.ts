import { useCallback, useState } from 'react';
import { translateText } from '../services/translation/mlkitTranslate';
import type { LanguageCode } from '../types';

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(
    async (text: string, from: LanguageCode, to: LanguageCode): Promise<string> => {
      setIsTranslating(true);
      setError(null);
      try {
        return await translateText(text, from, to);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Translation failed');
        return '';
      } finally {
        setIsTranslating(false);
      }
    },
    [],
  );

  return { translate, isTranslating, error };
}
