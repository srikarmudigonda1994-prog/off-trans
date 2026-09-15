import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { AppNavigator } from './navigation/AppNavigator';
import { useSetupStatus } from './hooks/useSetupStatus';

/**
 * Gates the app on the one-time model download. If setup hasn't run
 * yet, we still mount the full navigator but open on the Settings
 * tab, so the person lands on "download offline models" first.
 */
export default function App() {
  const { checking, ready } = useSetupStatus();

  if (checking) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return <AppNavigator initialRouteName={ready ? 'Text' : 'Settings'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
