import { initWhisper, WhisperContext } from 'whisper.rn';
import * as RNFS from '@dr.pogodin/react-native-fs';
import type { LanguageCode, TranscriptResult, TranscriptSegment } from '../../types';

let whisperContext: WhisperContext | null = null;

// The plain "base" model (no .en suffix) is multilingual, so it
// handles both Spanish and English with one download. Swap for
// "ggml-tiny.bin" for a smaller/faster but less accurate model, or
// "ggml-small.bin" for better accuracy at a larger download size.
const MODEL_FILENAME = 'ggml-base.bin';
const MODEL_URL = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODEL_FILENAME}`;

export function getModelPath(): string {
  return `${RNFS.DocumentDirectoryPath}/${MODEL_FILENAME}`;
}

export async function isModelDownloaded(): Promise<boolean> {
  return RNFS.exists(getModelPath());
}

/**
 * Downloads the whisper.cpp speech model once, into app-private
 * storage. This is the one-time network step referenced throughout
 * the app — after it succeeds, transcription never touches the
 * network again.
 */
export async function downloadModel(
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const path = getModelPath();
  const { promise } = RNFS.downloadFile({
    fromUrl: MODEL_URL,
    toFile: path,
    progressDivider: 5,
    progress: res => {
      if (onProgress && res.contentLength > 0) {
        onProgress(res.bytesWritten / res.contentLength);
      }
    },
  });
  await promise;
}

export async function loadWhisper(): Promise<WhisperContext> {
  if (whisperContext) return whisperContext;
  whisperContext = await initWhisper({ filePath: `file://${getModelPath()}` });
  return whisperContext;
}

export async function releaseWhisper(): Promise<void> {
  await whisperContext?.release();
  whisperContext = null;
}

/**
 * Transcribes a mono 16kHz WAV file on-device. `language` is a hint
 * ('en' | 'es') that improves accuracy — it does not translate.
 *
 * NOTE ON SEGMENT TIMING: whisper.cpp reports per-segment timestamps,
 * which whisper.rn exposes as `segments` alongside the plain-text
 * `result`. The exact field names (t0/t1 vs start/end, centiseconds
 * vs seconds) have shifted across whisper.rn releases — check
 * node_modules/whisper.rn/src/index.d.ts for the version you install
 * and adjust the mapping below if the shape differs.
 */
export async function transcribeAudio(
  filePath: string,
  language: LanguageCode,
): Promise<TranscriptResult> {
  const ctx = await loadWhisper();
  const { promise } = ctx.transcribe(filePath, { language });
  const { result, segments } = (await promise) as {
    result: string;
    segments?: Array<{ text: string; t0: number; t1: number }>;
  };

  const mapped: TranscriptSegment[] =
    segments?.map(s => ({
      text: s.text.trim(),
      startSec: s.t0 / 100, // whisper.cpp reports centiseconds
      endSec: s.t1 / 100,
    })) ?? [{ text: result.trim(), startSec: 0, endSec: 0 }];

  return { text: result.trim(), segments: mapped };
}
