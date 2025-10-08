import { useCallback } from 'react';
import { useConfigStore } from '../store';
import { useAudioQueue } from './useAudioQueue';

export function useTTS() {
  const config = useConfigStore((state) => state.config);
  const { enqueue } = useAudioQueue();

  const speak = useCallback(
    async (text: string) => {
      // Check if TTS is enabled
      if (!config?.tts?.enabled) {
        return;
      }

      try {
        const result = await window.electronAPI.ttsSpeak({
          text,
          voice: config.tts.voice || 'female-tianmei',
          speed: config.tts.speed || 1.0,
        });

        // Check if autoPlay is enabled
        if (config.tts.autoPlay) {
          // Add to audio queue
          enqueue({
            id: result.cacheKey,
            url: `file://${result.filePath}`,
            text,
          });
        }
      } catch (error) {
        console.error('[useTTS] Failed to speak:', error);
      }
    },
    [config, enqueue]
  );

  const cancel = useCallback(() => {
    window.electronAPI.ttsCancel();
  }, []);

  return {
    speak,
    cancel,
    enabled: config?.tts?.enabled ?? false,
    autoPlay: config?.tts?.autoPlay ?? false,
  };
}
