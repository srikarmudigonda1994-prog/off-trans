import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-next-react-native';
import RNFS from 'react-native-fs';
import type { TranscriptSegment } from '../../types';

// Note: the original ffmpeg-kit-react-native was retired in 2025.
// This app uses FFmpegKitNext (`ffmpeg-kit-next-react-native`), the
// actively maintained continuation — same execute()/session API.

/**
 * Re-encodes any audio or video file to mono 16kHz PCM WAV — the
 * format whisper.cpp expects. Shared by both the video screen
 * (extracting the audio track) and the audio screen (normalizing
 * whatever format the on-device recorder produced, which varies by
 * platform/device).
 */
async function transcodeToWhisperWav(inputPath: string): Promise<string> {
  const outPath = `${RNFS.CachesDirectoryPath}/whisper-input-${Date.now()}.wav`;
  const command = `-y -i "${inputPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outPath}"`;

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();
  if (!ReturnCode.isSuccess(returnCode)) {
    throw new Error('Failed to prepare audio for transcription');
  }
  return outPath;
}

/** Pulls the audio track out of a video file, ready for whisper.cpp. */
export async function extractAudioFromVideo(videoPath: string): Promise<string> {
  return transcodeToWhisperWav(videoPath);
}

/** Normalizes a raw recorded clip (m4a/aac/etc) for whisper.cpp. */
export async function transcodeAudioForWhisper(audioPath: string): Promise<string> {
  return transcodeToWhisperWav(audioPath);
}

/**
 * Burns translated subtitles into the video — the default, simpler
 * "video translation" output. Works for any language pair with no
 * lip-sync or timing concerns.
 */
export async function burnSubtitles(
  videoPath: string,
  srtPath: string,
): Promise<string> {
  const outputPath = `${RNFS.DocumentDirectoryPath}/subtitled-${Date.now()}.mp4`;
  const command = `-y -i "${videoPath}" -vf subtitles='${srtPath}' -c:a copy "${outputPath}"`;

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();
  if (!ReturnCode.isSuccess(returnCode)) {
    throw new Error('Failed to burn subtitles into video');
  }
  return outputPath;
}

/**
 * Replaces the video's audio track with a dubbed one (e.g. TTS
 * output stitched together). This is the harder "dubbing" path —
 * see README for why it's a documented extension rather than a
 * wired-up screen: matching TTS segment durations to the original
 * speech timing needs its own time-stretching/alignment logic.
 */
export async function replaceAudioTrack(
  videoPath: string,
  dubbedAudioPath: string,
): Promise<string> {
  const outputPath = `${RNFS.DocumentDirectoryPath}/dubbed-${Date.now()}.mp4`;
  const command = `-y -i "${videoPath}" -i "${dubbedAudioPath}" -map 0:v -map 1:a -c:v copy -shortest "${outputPath}"`;

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();
  if (!ReturnCode.isSuccess(returnCode)) {
    throw new Error('Failed to remux dubbed audio track');
  }
  return outputPath;
}

/** Builds an SRT subtitle file's contents from translated segments. */
export function buildSrt(segments: TranscriptSegment[]): string {
  const toTimestamp = (seconds: number): string => {
    const clamped = Math.max(0, seconds);
    const h = Math.floor(clamped / 3600);
    const m = Math.floor((clamped % 3600) / 60);
    const s = Math.floor(clamped % 60);
    const ms = Math.round((clamped - Math.floor(clamped)) * 1000);
    const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
  };

  return segments
    .map(
      (seg, i) =>
        `${i + 1}\n${toTimestamp(seg.startSec)} --> ${toTimestamp(seg.endSec)}\n${seg.text}\n`,
    )
    .join('\n');
}

export async function writeSrtFile(segments: TranscriptSegment[]): Promise<string> {
  const srtPath = `${RNFS.CachesDirectoryPath}/subs-${Date.now()}.srt`;
  await RNFS.writeFile(srtPath, buildSrt(segments), 'utf8');
  return srtPath;
}
