# Live2D Integration Design

## Overview

This document outlines the architecture for integrating Live2D character models into the STM desktop maid application.

## Technology Stack

### Option 1: pixi-live2d-display (Recommended)
- **Library**: `pixi-live2d-display`
- **Renderer**: PixiJS v7+
- **Pros**:
  - Active maintenance
  - Good TypeScript support
  - Handles Cubism 2/3/4 models
  - Easy integration with React
  - Built-in model loading and animation
- **Cons**:
  - Additional bundle size (~200KB)
  - Requires PixiJS dependency

### Option 2: Official Cubism SDK for Web
- **Library**: `@cubism/cubismwebframework`
- **Renderer**: WebGL
- **Pros**:
  - Official support from Live2D Inc.
  - Most up-to-date with latest features
  - Better performance
- **Cons**:
  - More complex setup
  - Less community examples
  - Requires manual WebGL context management

**Decision**: Start with `pixi-live2d-display` for faster development.

## Character Configuration Schema

### Character Manifest (`character.json`)

```typescript
interface CharacterManifest {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  version: string;               // Character version
  author?: string;               // Character author

  model: {
    path: string;                // Path to .model3.json
    scale: number;               // Default scale (1.0)
    position: { x: number; y: number }; // Default position
  };

  motions: {
    [state: string]: string[];   // State -> motion file mapping
    // Example:
    // idle: ["idle_01.motion3.json", "idle_02.motion3.json"]
    // speak: ["talk_01.motion3.json"]
    // think: ["think_01.motion3.json"]
  };

  expressions?: {
    [name: string]: string;      // Expression name -> file
  };

  sounds?: {
    [state: string]: string[];   // State -> audio file mapping
  };

  lipSync?: {
    enabled: boolean;
    parameterName: string;       // e.g., "ParamMouthOpenY"
    smoothing: number;           // 0-1
  };
}
```

### STMConfig Extension

```typescript
interface CharacterSection {
  currentCharacterId: string;    // Active character ID
  characters: CharacterInfo[];   // Available characters
}

interface CharacterInfo {
  id: string;
  name: string;
  path: string;                  // Path to character directory
  thumbnailPath?: string;        // Preview image
  enabled: boolean;
}
```

## Directory Structure

```
userData/
├── characters/
│   ├── default/
│   │   ├── character.json
│   │   ├── model3.json
│   │   ├── textures/
│   │   ├── motions/
│   │   └── expressions/
│   └── custom-character/
│       └── ...
└── config.json
```

## Component Architecture

### 1. CharacterRenderer Component

```typescript
// src/renderer/components/CharacterRenderer.tsx
interface CharacterRendererProps {
  characterId: string;
  state: MaidState;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function CharacterRenderer({
  characterId,
  state,
  onLoad,
  onError
}: CharacterRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application>();
  const modelRef = useRef<Live2DModel>();

  // Load character model
  useEffect(() => {
    loadCharacter(characterId);
  }, [characterId]);

  // Update animation based on state
  useEffect(() => {
    playMotionForState(state);
  }, [state]);

  return <canvas ref={canvasRef} />;
}
```

### 2. State to Motion Mapping

```typescript
// src/renderer/hooks/useCharacterMotion.ts
export function useCharacterMotion(
  model: Live2DModel | null,
  manifest: CharacterManifest | null,
  state: MaidState
) {
  useEffect(() => {
    if (!model || !manifest) return;

    const motions = manifest.motions[state];
    if (motions && motions.length > 0) {
      // Pick random motion from available options
      const motionFile = motions[Math.floor(Math.random() * motions.length)];
      model.motion(state, motionFile);
    }
  }, [model, manifest, state]);
}
```

### 3. Lip Sync Integration

```typescript
// src/renderer/hooks/useLipSync.ts
export function useLipSync(
  model: Live2DModel | null,
  audioElement: HTMLAudioElement | null,
  config: CharacterManifest['lipSync']
) {
  useEffect(() => {
    if (!model || !audioElement || !config?.enabled) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioElement);

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function updateLipSync() {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;

      // Apply smoothing and set parameter
      const smoothed = volume * (1 - config.smoothing) +
                       model.internalModel.coreModel.getParameterValueById(
                         config.parameterName
                       ) * config.smoothing;

      model.internalModel.coreModel.setParameterValueById(
        config.parameterName,
        smoothed
      );

      requestAnimationFrame(updateLipSync);
    }

    updateLipSync();

    return () => {
      audioContext.close();
    };
  }, [model, audioElement, config]);
}
```

## Main Process - Character Management

### Character Import API

```typescript
// src/main/ipc/character.ts
import AdmZip from 'adm-zip';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

export async function importCharacter(zipPath: string): Promise<CharacterInfo> {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  // Find and validate character.json
  const manifestEntry = entries.find(e => e.entryName === 'character.json');
  if (!manifestEntry) {
    throw new Error('Invalid character package: missing character.json');
  }

  const manifest: CharacterManifest = JSON.parse(
    manifestEntry.getData().toString()
  );

  // Validate manifest
  validateCharacterManifest(manifest);

  // Extract to characters directory
  const charactersDir = path.join(app.getPath('userData'), 'characters');
  const characterDir = path.join(charactersDir, manifest.id);

  await fs.mkdir(characterDir, { recursive: true });
  zip.extractAllTo(characterDir, true);

  return {
    id: manifest.id,
    name: manifest.name,
    path: characterDir,
    enabled: true,
  };
}
```

## Settings UI - Character Management

```typescript
// src/renderer/components/settings/sections/CharactersSection.tsx
export function CharactersSection({ config, toast }: SectionProps) {
  const characters = config.config?.characters?.characters || [];
  const currentId = config.config?.characters?.currentCharacterId;

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const result = await window.character.import(file.path);
        if (result.success) {
          toast.success(`Character "${result.name}" imported`);
          config.refresh();
        } else {
          toast.error(result.error);
        }
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Character list */}
      {/* Import button */}
      {/* Preview */}
    </div>
  );
}
```

## Integration Steps

### Phase 1: Setup & Basic Rendering
1. Install dependencies: `npm install pixi.js pixi-live2d-display`
2. Create CharacterRenderer component
3. Test with sample Live2D model
4. Replace Maid placeholder in App.tsx

### Phase 2: State Management
1. Extend STMConfig with character section
2. Create character manifest loader
3. Implement state-to-motion mapping
4. Test all MaidState transitions

### Phase 3: Resource Management
1. Implement character import/export
2. Create character selection UI
3. Add thumbnail generation
4. Implement character validation

### Phase 4: Advanced Features
1. Implement lip sync with TTS
2. Add expression system
3. Integrate with appearance config (scale, opacity)
4. Add physics/breathing idle animation

## Testing Plan

1. **Unit Tests**
   - Manifest validation
   - State-to-motion mapping
   - Import/export logic

2. **Integration Tests**
   - Load character from disk
   - Switch between characters
   - Verify all state transitions

3. **Manual Tests**
   - Import .zip package
   - Verify animations smooth
   - Test lip sync accuracy
   - Check performance (FPS)

## Performance Considerations

- Use texture atlases for efficient rendering
- Implement lazy loading for character assets
- Cache loaded models in memory
- Limit concurrent animations
- Use requestAnimationFrame for smooth updates
- Consider Web Workers for heavy calculations

## Fallback Strategy

If Live2D fails to load:
1. Show error message to user
2. Fall back to static image or SVG maid
3. Log error for debugging
4. Provide "Reset to Default" option

## Future Enhancements

- Multiple characters support (switching)
- Character marketplace/download
- Custom expression editor
- Motion blending
- Physics simulation
- Interactive touch points
- Seasonal costume variants
