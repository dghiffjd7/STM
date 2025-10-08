import { useEffect } from 'react';
import type { Live2DModel } from 'pixi-live2d-display';
import type { MaidState, CharacterManifest } from '../../shared/types';

/**
 * Hook to manage character motion based on MaidState
 * Maps application states to Live2D motions defined in character manifest
 */
export function useCharacterMotion(
  model: Live2DModel | null,
  manifest: CharacterManifest | null,
  state: MaidState
) {
  useEffect(() => {
    if (!model || !manifest) return;

    const motions = manifest.motions[state];
    if (motions && motions.length > 0) {
      // Pick random motion from available options for variety
      const motionFile = motions[Math.floor(Math.random() * motions.length)];

      // Play the motion
      // Priority 2 = normal priority, not forced
      model.motion(state as string, 0, 2);

      console.log(`[CharacterMotion] Playing motion for state "${state}": ${motionFile}`);
    } else {
      console.warn(`[CharacterMotion] No motions defined for state: ${state}`);
    }
  }, [model, manifest, state]);
}
