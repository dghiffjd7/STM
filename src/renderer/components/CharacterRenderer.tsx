import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';
import type { MaidState } from '../../shared/types';

// Enable global Live2D support
if (typeof window !== 'undefined') {
  (window as any).PIXI = { Application };
}

interface CharacterRendererProps {
  characterId: string;
  state: MaidState;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function CharacterRenderer({
  characterId,
  state,
  className = '',
  onLoad,
  onError,
}: CharacterRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application>();
  const modelRef = useRef<Live2DModel>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize PixiJS application
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      view: canvasRef.current,
      width: 300,
      height: 300,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    appRef.current = app;

    return () => {
      app.destroy(true, { children: true, texture: true });
    };
  }, []);

  // Load character model
  useEffect(() => {
    if (!appRef.current) return;

    const loadModel = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Load character manifest and get model path
        // For prototype, we'll need a sample model URL or path
        // const manifest = await loadCharacterManifest(characterId);
        // const modelPath = manifest.model.path;

        // Placeholder: User will need to provide a Live2D model
        // For now, we'll show error message if no model is available
        throw new Error(
          'Live2D model not configured. Please provide a .model3.json file path in character manifest.'
        );

        // Commented out actual loading code for when model is available:
        /*
        const model = await Live2DModel.from(modelPath);

        if (appRef.current && model) {
          // Clear previous model
          if (modelRef.current) {
            appRef.current.stage.removeChild(modelRef.current);
          }

          // Add model to stage
          modelRef.current = model;
          appRef.current.stage.addChild(model);

          // Center the model
          model.anchor.set(0.5, 0.5);
          model.position.set(
            appRef.current.screen.width / 2,
            appRef.current.screen.height / 2
          );

          // Scale to fit
          const scale = Math.min(
            appRef.current.screen.width / model.width,
            appRef.current.screen.height / model.height
          ) * 0.8;
          model.scale.set(scale);

          setLoading(false);
          onLoad?.();
        }
        */
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    loadModel();
  }, [characterId, onLoad, onError]);

  // Update animation based on state
  useEffect(() => {
    if (!modelRef.current) return;

    // TODO: Implement motion mapping
    // const motions = manifest.motions[state];
    // if (motions && motions.length > 0) {
    //   const motion = motions[Math.floor(Math.random() * motions.length)];
    //   modelRef.current.motion(state, motion);
    // }
  }, [state]);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
          <div className="text-white text-sm">Loading character...</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg p-4">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
              Failed to load character
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              {error}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
