import * as Speech from 'expo-speech';
import { useCallback, useState } from 'react';

import { useSettings } from './useSettings';

export function useSpeech() {
  const { language, speechRate } = useSettings();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) return;
      void Speech.stop();
      setIsSpeaking(true);
      Speech.speak(value, {
        language,
        rate: speechRate,
        pitch: 1,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [language, speechRate]
  );

  const stop = useCallback(async () => {
    await Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
