import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateText } from '../translation/mlkitTranslate';
import {
  downloadModel as downloadWhisperModel,
  isModelDownloaded as isWhisperModelDownloaded,
} from '../speech/whisperStt';

const SETUP_COMPLETE_KEY = 'offline-translator:setup-complete';

/**
 * True once every offline model this app needs (both ML Kit
 * translation directions + the whisper.cpp speech model) has been
 * downloaded at least once. From then on the app makes zero network
 * calls to do its job.
 */
export async function isSetupComplete(): Promise<boolean> {
  const flag = await AsyncStorage.getItem(SETUP_COMPLETE_KEY);
  if (flag === 'true') return true;
  return isWhisperModelDownloaded();
}

export async function runFirstTimeSetup(
  onProgress: (label: string, fraction: number) => void,
): Promise<void> {
  onProgress('Downloading English → Spanish model', 0);
  await translateText('hello', 'en', 'es');

  onProgress('Downloading Spanish → English model', 0.3);
  await translateText('hola', 'es', 'en');

  onProgress('Downloading speech recognition model', 0.5);
  await downloadWhisperModel(fraction => {
    onProgress('Downloading speech recognition model', 0.5 + fraction * 0.5);
  });

  await AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true');
  onProgress('Done', 1);
}
