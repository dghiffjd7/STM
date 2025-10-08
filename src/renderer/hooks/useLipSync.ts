import { useEffect, useRef } from 'react';
import type { Live2DModel } from 'pixi-live2d-display';
import type { CharacterManifest } from '../../shared/types';

/**
 * Hook to synchronize lip movements with audio playback
 * Uses Web Audio API to analyze audio volume and control mouth parameter
 */
export function useLipSync(
  model: Live2DModel | null,
  audioElement: HTMLAudioElement | null,
  config: CharacterManifest['lipSync']
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!model || !audioElement || !config?.enabled) {
      return;
    }

    try {
      // Create audio context and analyser
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioElement);

      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let previousValue = 0;

      const updateLipSync = () => {
        if (!analyserRef.current || !model.internalModel) {
          return;
        }

        // Get frequency data
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume (0-1)
        const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;

        // Apply smoothing to prevent jerky movements
        const smoothed =
          volume * (1 - config.smoothing) + previousValue * config.smoothing;
        previousValue = smoothed;

        // Set the mouth parameter (typically "ParamMouthOpenY")
        try {
          // Access core model and set parameter
          const coreModel = (model.internalModel as any).coreModel;
          if (coreModel && typeof coreModel.setParameterValueById === 'function') {
            coreModel.setParameterValueById(config.parameterName, smoothed);
          }
        } catch (err) {
          console.error('[LipSync] Failed to set parameter:', err);
        }

        animationFrameRef.current = requestAnimationFrame(updateLipSync);
      };

      updateLipSync();

      console.log('[LipSync] Started lip sync with parameter:', config.parameterName);
    } catch (err) {
      console.error('[LipSync] Failed to initialize:', err);
    }

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch((err) => {
          console.error('[LipSync] Failed to close AudioContext:', err);
        });
      }

      console.log('[LipSync] Stopped lip sync');
    };
  }, [model, audioElement, config]);
}
