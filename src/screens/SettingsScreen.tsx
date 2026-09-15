import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '../components/ProgressBar';
import { useSetupStatus } from '../hooks/useSetupStatus';

export function SettingsScreen() {
  const { ready, downloading, progressLabel, progressFraction, error, startSetup } =
    useSetupStatus();

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
});
