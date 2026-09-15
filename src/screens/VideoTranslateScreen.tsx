import React from 'react';
import { Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

/**
 * Video translation needs real video-container handling (extracting
 * the audio track, burning subtitles back in) — the kind of thing
 * FFmpeg is normally used for. The maintained FFmpeg packages
 * available for React Native right now are either genuinely
 * unavailable (the official FFmpegKit continuation isn't published
 * to npm) or come from a source whose trustworthiness for a
 * compiled native binary couldn't be established, so this screen is
 * intentionally left unimplemented rather than wired to something
 * unverified. Text and audio translation are unaffected — they don't
 * depend on this.
 */
export function VideoTranslateScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Video isn't available yet</Text>
        <Text style={styles.body}>
          Video translation needs a native FFmpeg build to extract audio and
          burn in subtitles. The library that would normally provide that
          isn't safely available right now — see the README for details and
          for where to pick this up once a trustworthy source exists.
        </Text>
        <Pressable
          onPress={() =>
            Linking.openURL(
              'https://github.com/arthenica/ffmpeg-kit-next',
            )
          }>
          <Text style={styles.link}>FFmpegKitNext (the official continuation)</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  card: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 14, color: '#555', lineHeight: 20 },
  link: { fontSize: 14, color: '#2563eb', textDecorationLine: 'underline' },
});
