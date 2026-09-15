import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  label: string;
  fraction: number; // 0..1
}

export function ProgressBar({ label, fraction }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 6 },
  label: { fontSize: 14, color: '#444' },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e2e2',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#2563eb' },
  pct: { fontSize: 12, color: '#888', textAlign: 'right' },
});
