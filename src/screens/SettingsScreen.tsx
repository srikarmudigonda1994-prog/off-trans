import React, { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { ProgressBar } from '../components/ProgressBar';
import { useSetupStatus } from '../hooks/useSetupStatus';

const CRASH_LOG_PATH = `${RNFS.DocumentDirectoryPath}/last_crash.txt`;

export function SettingsScreen() {
  const { ready, downloading, progressLabel, progressFraction, error, startSetup } =
    useSetupStatus();
  const [crashLog, setCrashLog] = useState<string | null>(null);

  useEffect(() => {
    RNFS.exists(CRASH_LOG_PATH)
      .then(exists => (exists ? RNFS.readFile(CRASH_LOG_PATH, 'utf8') : null))
      .then(setCrashLog)
      .catch(() => setCrashLog(null));
  }, []);

  const clearCrashLog = () => {
    RNFS.unlink(CRASH_LOG_PATH)
      .catch(() => {})
      .finally(() => setCrashLog(null));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Offline models</Text>
      <Text style={styles.body}>
        Translation, speech recognition, and speech playback all run on this
        device. The only time this app needs a network connection is to
        download the models below, once.
      </Text>

      <View style={styles.statusRow}>
        <View style={[styles.dot, ready ? styles.dotReady : styles.dotPending]} />
        <Text style={styles.statusText}>
          {ready ? 'All models downloaded — app works offline' : 'Setup needed'}
        </Text>
      </View>

      {downloading && (
        <ProgressBar label={progressLabel} fraction={progressFraction} />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {!ready && (
        <Pressable
          style={[styles.button, downloading && styles.buttonDisabled]}
          disabled={downloading}
          onPress={startSetup}>
          <Text style={styles.buttonText}>
            {downloading ? 'Downloading…' : 'Download offline models'}
          </Text>
        </Pressable>
      )}

      <Text style={styles.footnote}>
        Speech recognition model (~140MB) + two small translation language
        packs (~30MB each). Wi-Fi recommended.
      </Text>

      {crashLog && (
        <View style={styles.crashSection}>
          <Text style={styles.title}>Last crash</Text>
          <Text style={styles.body}>
            The app caught a crash last time it closed unexpectedly. Screenshot
            this to share it, then clear it below.
          </Text>
          <ScrollView style={styles.crashBox} nestedScrollEnabled>
            <Text style={styles.crashText} selectable>
              {crashLog}
            </Text>
          </ScrollView>
          <Pressable style={styles.clearButton} onPress={clearCrashLog}>
            <Text style={styles.clearButtonText}>Clear crash log</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 14 },
  title: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 14, color: '#555', lineHeight: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotReady: { backgroundColor: '#16a34a' },
  dotPending: { backgroundColor: '#f59e0b' },
  statusText: { fontSize: 14 },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#dc2626' },
  footnote: { fontSize: 12, color: '#999' },
  crashSection: { gap: 10, marginTop: 10 },
  crashBox: {
    maxHeight: 260,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 10,
  },
  crashText: { color: '#f87171', fontSize: 11, fontFamily: 'monospace' },
  clearButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearButtonText: { color: '#dc2626', fontWeight: '600' },
});
