import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LanguageSwap } from '../components/LanguageSwap';
import { transcribeAudio } from '../services/speech/whisperStt';
import { startRecording, stopRecording } from '../services/speech/audioRecorder';
import { translateText } from '../services/translation/mlkitTranslate';
import { speak } from '../services/speech/tts';
import { otherLanguage } from '../constants/languages';
import type { LanguageCode } from '../types';

type Stage = 'idle' | 'recording' | 'transcribing' | 'translating' | 'done';

export function AudioTranslateScreen() {
  const [from, setFrom] = useState<LanguageCode>('en');
  const [stage, setStage] = useState<Stage>('idle');
  const [transcript, setTranscript] = useState('');
  const [translated, setTranslated] = useState('');
  const [error, setError] = useState<string | null>(null);

  const to = otherLanguage(from);

  const reset = () => {
    setTranscript('');
    setTranslated('');
    setError(null);
  };

  const handleStart = async () => {
    reset();
    try {
      // Requests the microphone permission if needed and starts the
      // stream; stays on 'idle' (rather than optimistically flipping
      // to 'recording') until that's actually succeeded, so a denied
      // permission shows an error instead of a stuck fake-recording UI.
      await startRecording();
      setStage('recording');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not start recording',
      );
      setStage('idle');
    }
  };

  const handleStop = async () => {
    try {
      setStage('transcribing');
      // Recording is already 16kHz mono WAV — no conversion step needed.
      const wavPath = await stopRecording();
      const { text } = await transcribeAudio(wavPath, from);
      setTranscript(text);

      setStage('translating');
      const result = await translateText(text, from, to);
      setTranslated(result);

      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setStage('idle');
    }
  };

  const handleSwap = () => {
    setFrom(to);
    reset();
    setStage('idle');
  };

  const isBusy = stage === 'transcribing' || stage === 'translating';

  return (
    <SafeAreaView style={styles.container}>
      <LanguageSwap from={from} to={to} onSwap={handleSwap} />

      <View style={styles.recordArea}>
        <Pressable
          style={[
            styles.recordButton,
            stage === 'recording' && styles.recordButtonActive,
          ]}
          disabled={isBusy}
          onPress={stage === 'recording' ? handleStop : handleStart}>
          <Text style={styles.recordIcon}>{stage === 'recording' ? '■' : '●'}</Text>
        </Pressable>
        <Text style={styles.hint}>
          {stage === 'recording'
            ? 'Recording — tap to stop'
            : isBusy
            ? stage === 'transcribing'
              ? 'Transcribing on-device…'
              : 'Translating…'
            : 'Tap to record'}
        </Text>
        {isBusy && <ActivityIndicator style={{ marginTop: 8 }} />}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {transcript.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Heard</Text>
          <Text style={styles.cardText}>{transcript}</Text>
        </View>
      )}

      {translated.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Translation</Text>
          <View style={styles.cardRow}>
            <Text style={[styles.cardText, { flex: 1 }]}>{translated}</Text>
            <Pressable onPress={() => speak(translated, to)}>
              <Text style={styles.speakIcon}>🔊</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  recordArea: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  recordButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: { backgroundColor: '#991b1b' },
  recordIcon: { fontSize: 28, color: '#fff' },
  hint: { fontSize: 14, color: '#666' },
  error: { color: '#dc2626' },
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  cardLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  cardText: { fontSize: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speakIcon: { fontSize: 20 },
});
