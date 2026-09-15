import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

// Records 16kHz mono WAV directly via a small custom native module
// (SimpleAudioRecorderModule.kt, added to the Android project by the
// build workflow) built on Android's own android.media.AudioRecord —
// no third-party audio-recording package involved. That's deliberate:
// every third-party option tried here either crashed natively on this
// device or predates the New Architecture. AudioRecord is a core,
// decades-stable part of the Android SDK itself, maintained by Google,
// not a small community package.
const { SimpleAudioRecorder } = NativeModules;

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
  await SimpleAudioRecorder.startRecording();
}

/** Stops the active recording and returns the path to a finished .wav file. */
export async function stopRecording(): Promise<string> {
  const path: string = await SimpleAudioRecorder.stopRecording();
  return path;
}
