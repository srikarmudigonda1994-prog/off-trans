import { useCallback, useEffect, useState } from 'react';
import { isSetupComplete, runFirstTimeSetup } from '../services/models/modelManager';

export function useSetupStatus() {
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [progressFraction, setProgressFraction] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isSetupComplete()
      .then(setReady)
      .finally(() => setChecking(false));
  }, []);

  const startSetup = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      await runFirstTimeSetup((label, fraction) => {
        setProgressLabel(label);
        setProgressFraction(fraction);
      });
      setReady(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Setup failed — check your connection and try again',
      );
    } finally {
      setDownloading(false);
    }
  }, []);

  return {
    checking,
    ready,
    downloading,
    progressLabel,
    progressFraction,
    error,
    startSetup,
  };
}
