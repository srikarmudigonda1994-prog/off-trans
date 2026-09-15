import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { LanguageSwap } from '../components/LanguageSwap';
import { transcribeAudio } from '../services/speech/whisperStt';
import { translateText } from '../services/translation/mlkitTranslate';
import {
  extractAudioFromVideo,
  burnSubtitles,
  writeSrtFile,
} from '../services/video/ffmpegPipeline';
import { otherLanguage } from '../constants/languages';
import type { LanguageCode, TranscriptSegment } from '../types';

type Stage =
  | 'idle'
  | 'extracting-audio'
  | 'transcribing'
  | 'translating'
  | 'burning-subtitles'
  | 'done';

const STAGE_LABEL: Record<Stage, string> = {
  idle: 'Pick a video to translate its subtitles',
  'extracting-audio': 'Extracting audio…',
  transcribing: 'Transcribing on-device…',
  translating: 'Translating segments…',
  'burning-subtitles': 'Burning in subtitles…',
  done: 'Done',
};

export function VideoTranslateScreen() {
  const [from, setFrom] = useState<LanguageCode>('en');
  const [stage, setStage] = useState<Stage>('idle');
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const to = otherLanguage(from);
  const isBusy = stage !== 'idle' && stage !== 'done';

  const handlePickVideo = async () => {
    setError(null);
    setOutputPath(null);
    try {
      const video = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.video],
        copyTo: 'cachesDirectory',
      });
      const videoPath = video.fileCopyUri ?? video.uri;
      await runPipeline(videoPath);
    } catch (e) {
      if (DocumentPicker.isCancel(e)) return;
      setError(e instanceof Error ? e.message : 'Could not open that video');
      setStage('idle');
    }
  };

  const runPipeline = async (videoPath: string) => {
    try {
      setStage('extracting-audio');
      const audioPath = await extractAudioFromVideo(videoPath);

      setStage('transcribing');
      const { segments } = await transcribeAudio(audioPath, from);

      setStage('translating');
      const translatedSegments: TranscriptSegment[] = await Promise.all(
        segments.map(async seg => ({
          ...seg,
          text: await translateText(seg.text, from, to),
        })),
      );

      setStage('burning-subtitles');
      const srtPath = await writeSrtFile(translatedSegments);
      const finalPath = await burnSubtitles(videoPath, srtPath);

      setOutputPath(finalPath);
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Video translation failed');
      setStage('idle');
    }
  };

  const handleSwap = () => {
    setFrom(to);
    setOutputPath(null);
    setStage('idle');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LanguageSwap from={from} to={to} onSwap={handleSwap} />

      <View style={styles.pickArea}>
        <Pressable
          style={[styles.pickButton, isBusy && styles.pickButtonDisabled]}
          disabled={isBusy}
          onPress={handlePickVideo}>
          <Text style={styles.pickButtonText}>
            {stage === 'idle' ? 'Choose video' : 'Working…'}
          </Text>
        </Pressable>
        <Text style={styles.stageLabel}>{STAGE_LABEL[stage]}</Text>
        {isBusy && <ActivityIndicator style={{ marginTop: 8 }} />}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {outputPath && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Subtitled video saved to</Text>
          <Text style={styles.cardText}>{outputPath}</Text>
        </View>
      )}

      <Text style={styles.note}>
        This produces burned-in translated subtitles. Dubbing (replacing the
        spoken audio) is a documented extension in ffmpegPipeline.ts — see the
        README for why it needs extra work.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  pickArea: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  pickButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  pickButtonDisabled: { opacity: 0.5 },
  pickButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  stageLabel: { fontSize: 14, color: '#666', textAlign: 'center' },
  error: { color: '#dc2626' },
  card: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 14, gap: 6 },
  cardLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  cardText: { fontSize: 13 },
  note: { fontSize: 12, color: '#999', marginTop: 'auto' },
});
