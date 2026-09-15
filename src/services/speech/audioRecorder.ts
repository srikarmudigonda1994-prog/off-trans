import {
  AUDIO_FORMATS,
  AUDIO_SOURCES,
  CHANNEL_CONFIGS,
  InputAudioStream,
} from '@dr.pogodin/react-native-audio';
import { Buffer } from 'buffer';
import { PermissionsAndroid, Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';

// Records raw 16kHz mono PCM directly — the exact format whisper.cpp
// needs — so no transcoding step (and no FFmpeg dependency) is needed
// afterwards. A WAV file is just a 44-byte header in front of raw PCM
// samples, so we build that header ourselves rather than pull in a
// heavier library for it.

const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

let activeStream: InputAudioStream | null = null;
let chunks: Buffer[] = [];

function buildWavHeader(dataLength: number): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (SAMPLE_RATE * CHANNELS * BITS_PER_SAMPLE) / 8;
  const blockAlign = (CHANNELS * BITS_PER_SAMPLE) / 8;

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // PCM subchunk size
  header.writeUInt16LE(1, 20); // audio format: 1 = PCM
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataLength, 40);

  return header;
}

/**
 * The manifest declares RECORD_AUDIO, but Android also requires the
 * app to explicitly ask the user for that permission at runtime —
 * without this, the native recorder throws a security exception with
 * nothing on the JS side to catch it, which crashes the whole app
 * rather than surfacing a normal error. PermissionsAndroid is part of
 * React Native core, so this needs no extra native dependency.
 */
async function ensureMicPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone permission',
      message: 'Offline Translator needs microphone access to record what you say.',
      buttonPositive: 'OK',
    },
  );
  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('Microphone permission was not granted');
  }
}

export async function startRecording(): Promise<void> {
  await ensureMicPermission();

  chunks = [];
  // RAW = no automatic gain control / noise suppression, matching the
  // library's own example. Fine for speech-to-text input.
  activeStream = new InputAudioStream(
    AUDIO_SOURCES.RAW,
    SAMPLE_RATE,
    CHANNEL_CONFIGS.MONO,
    AUDIO_FORMATS.PCM_16BIT,
    4096, // sampling/chunk size in bytes
  );
  activeStream.addChunkListener(chunk => {
    chunks.push(chunk);
  });
  activeStream.start();
}

/** Stops the active recording and returns the path to a finished .wav file. */
export async function stopRecording(): Promise<string> {
  if (!activeStream) {
    throw new Error('No active recording to stop');
  }
  activeStream.destroy();
  activeStream = null;

  const pcmData = Buffer.concat(chunks);
  chunks = [];
  const wavData = Buffer.concat([buildWavHeader(pcmData.length), pcmData]);

  const path = `${RNFS.CachesDirectoryPath}/recording-${Date.now()}.wav`;
  await RNFS.writeFile(path, wavData.toString('base64'), 'base64');
  return path;
}
