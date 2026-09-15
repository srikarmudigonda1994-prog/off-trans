import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LanguageSwap } from '../components/LanguageSwap';
import { useTranslation } from '../hooks/useTranslation';
import { speak } from '../services/speech/tts';
import { otherLanguage } from '../constants/languages';
import type { LanguageCode } from '../types';

export function TextTranslateScreen() {
  const [from, setFrom] = useState<LanguageCode>('en');
  const [sourceText, setSourceText] = useState('');
  const [resultText, setResultText] = useState('');
  const { translate, isTranslating, error } = useTranslation();

  const to = otherLanguage(from);

  const handleSwap = () => {
    setFrom(to);
    setSourceText(resultText);
    setResultText(sourceText);
  };

  const handleTranslate = async () => {
    const translated = await translate(sourceText, from, to);
    setResultText(translated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LanguageSwap from={from} to={to} onSwap={handleSwap} />

      <TextInput
        style={styles.input}
        multiline
        placeholder={`Type in ${from === 'en' ? 'English' : 'Español'}...`}
        value={sourceText}
        onChangeText={setSourceText}
      />

      <Pressable
        style={[styles.button, !sourceText.trim() && styles.buttonDisabled]}
        onPress={handleTranslate}
        disabled={!sourceText.trim() || isTranslating}>
        {isTranslating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Translate</Text>
        )}
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      {resultText.length > 0 && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{resultText}</Text>
          <Pressable
            style={styles.speakButton}
            onPress={() => speak(resultText, to)}>
            <Text style={styles.speakIcon}>🔊</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#dc2626' },
  resultBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultText: { flex: 1, fontSize: 16 },
  speakButton: { padding: 4 },
  speakIcon: { fontSize: 20 },
});
