import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LANGUAGE_NAMES } from '../constants/languages';
import type { LanguageCode } from '../types';

interface Props {
  from: LanguageCode;
  to: LanguageCode;
  onSwap: () => void;
}

export function LanguageSwap({ from, to, onSwap }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.lang}>{LANGUAGE_NAMES[from]}</Text>
      <Pressable onPress={onSwap} style={styles.swapButton} hitSlop={12}>
        <Text style={styles.swapIcon}>⇄</Text>
      </Pressable>
      <Text style={styles.lang}>{LANGUAGE_NAMES[to]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  lang: {
    fontSize: 16,
    fontWeight: '600',
    width: 100,
    textAlign: 'center',
  },
  swapButton: {
    marginHorizontal: 16,
    padding: 8,
  },
  swapIcon: {
    fontSize: 20,
  },
});
