// Import order is critical for Live2D:
// 1. Import PIXI first
import type { Application } from 'pixi.js';
import * as PIXI from 'pixi.js';

// 2. Set global PIXI before loading cubism
if (typeof window !== 'undefined') {
  (window as any).PIXI = PIXI;
}

// React imports
import { useEffect, useRef, useState } from 'react';
import type { CharacterManifest, MaidState } from '../../shared/types';
import { useCharacterMotion } from '../hooks/useCharacterMotion';

// Live2DModel will be dynamically imported after ensuring Cubism core is loaded
type Live2DModelType = any;

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
  const modelRef = useRef<Live2DModelType>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<CharacterManifest | null>(null);
  const [pixiReady, setPixiReady] = useState(false);
  const [live2dReady, setLive2dReady] = useState(false);

  // Use motion hook to update animations based on state
  useCharacterMotion(modelRef.current || null, manifest, state);

  // Initialize PixiJS application
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const app = new PIXI.Application({
        view: canvasRef.current,
        width: 300,
        height: 300,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        // Workaround for WebGL shader issues
        hello: false, // Disable hello message
      });

      appRef.current = app;
      setPixiReady(true);
      console.log('[CharacterRenderer] PixiJS initialized successfully');

      return () => {
        app.destroy(true, { children: true, texture: true });
        appRef.current = undefined;
        setPixiReady(false);
      };
    } catch (err) {
      console.error('[CharacterRenderer] Failed to initialize PixiJS:', err);
      setError('Failed to initialize graphics engine');
      setLoading(false);
      onError?.(err instanceof Error ? err : new Error('Failed to initialize PixiJS'));
    }
  }, [onError]);

  // Wait for Live2D Cubism Core to be ready
  useEffect(() => {
    if (!pixiReady) return;

    const checkCubismCore = () => {
      if ((window as any).Live2DCubismCore) {
        console.log('[CharacterRenderer] Live2D Cubism Core detected');
        setLive2dReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkCubismCore()) return;

    // If not ready, poll every 100ms
    console.log('[CharacterRenderer] Waiting for Live2D Cubism Core...');
    const interval = setInterval(() => {
      if (checkCubismCore()) {
        clearInterval(interval);
      }
    }, 100);

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!(window as any).Live2DCubismCore) {
        console.error('[CharacterRenderer] Live2D Cubism Core failed to load after 5 seconds');
        setError('Live2D Cubism Core failed to load');
        setLoading(false);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pixiReady]);

  // Load character model
  useEffect(() => {
    if (!pixiReady || !live2dReady) return;

    let cancelled = false;

    const loadModel = async () => {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import pixi-live2d-display AFTER Cubism core is ready
        console.log('[CharacterRenderer] Importing pixi-live2d-display...');
        const { Live2DModel } = await import('pixi-live2d-display/cubism4');
        console.log('[CharacterRenderer] pixi-live2d-display loaded');
        
        if (cancelled) return;

        // Load character manifest
        const loadedManifest = await window.character.getManifest(characterId);
        if (cancelled) return;

        setManifest(loadedManifest);
        console.log('[CharacterRenderer] Manifest loaded:', loadedManifest);

        // Get the file:// URL from IPC (already converted by main process)
        const modelUrl = await window.character.getResourcePath(
          characterId,
          loadedManifest.model.path
        );
        console.log('[CharacterRenderer] Model URL from IPC:', modelUrl);

        // Load the Live2D model
        console.log('[CharacterRenderer] Attempting to load Live2D model...');
        const model = await Live2DModel.from(modelUrl);
        if (cancelled) return;

        console.log('[CharacterRenderer] Live2D model instance created:', model);

        const app = appRef.current;

        if (!app || !app.stage || cancelled) {
          console.warn('[CharacterRenderer] Pixi application unavailable during model load');
          return;
        }

        // Clear previous model
        if (modelRef.current) {
          app.stage.removeChild(modelRef.current);
          modelRef.current.destroy();
        }

        // Add model to stage
        modelRef.current = model;
        app.stage.addChild(model);

        // Center the model
        model.anchor.set(0.5, 0.5);
        model.position.set(app.screen.width / 2, app.screen.height / 2);

        // Apply scale from manifest
        const baseScale = loadedManifest.model.scale || 1.0;
        const fitScale =
          Math.min(app.screen.width / model.width, app.screen.height / model.height) * 0.8;
        model.scale.set(baseScale * fitScale);

        // Apply position offset from manifest
        if (loadedManifest.model.position) {
          model.position.x += loadedManifest.model.position.x;
          model.position.y += loadedManifest.model.position.y;
        }

        if (cancelled) {
          return;
        }

        setLoading(false);
        onLoad?.();
        console.log('[CharacterRenderer] Model loaded successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[CharacterRenderer] Failed to load model!');
        console.error('[CharacterRenderer] Error message:', errorMessage);
        console.error('[CharacterRenderer] Error stack:', err instanceof Error ? err.stack : 'N/A');
        console.error('[CharacterRenderer] Full error object:', err);
        setError(errorMessage);
        setLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    loadModel();

    // Cleanup on unmount or character change
    return () => {
      cancelled = true;
      if (modelRef.current && appRef.current) {
        appRef.current.stage.removeChild(modelRef.current);
        modelRef.current.destroy();
        modelRef.current = undefined;
      }
    };
  }, [pixiReady, live2dReady, characterId, onLoad, onError]);

  // Note: Animation updates are handled by useCharacterMotion hook

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
