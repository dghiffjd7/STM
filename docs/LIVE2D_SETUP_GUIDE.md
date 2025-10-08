# Live2D Setup Guide

## Quick Start

The Live2D integration framework is now in place. To use it:

### 1. Enable Live2D Rendering

In `src/renderer/components/Maid.tsx`, change:
```typescript
const USE_LIVE2D = false;
```
to:
```typescript
const USE_LIVE2D = true;
```

### 2. Prepare a Live2D Model

You need a Cubism 2.x, 3.x, or 4.x model with the following files:
- `.model3.json` (model definition)
- `.moc3` (compiled model data)
- Texture files (PNG)
- Motion files (`.motion3.json`)
- Expression files (optional)

### 3. Create Character Manifest

Create a `character.json` file in your character directory:

```json
{
  "id": "my-character",
  "name": "My Character",
  "version": "1.0.0",
  "author": "Your Name",
  "model": {
    "path": "./model.model3.json",
    "scale": 1.0,
    "position": { "x": 0, "y": 0 }
  },
  "motions": {
    "idle": ["idle_01.motion3.json", "idle_02.motion3.json"],
    "hover": ["greeting.motion3.json"],
    "drag": ["surprised.motion3.json"],
    "speak": ["talk_01.motion3.json"],
    "think": ["thinking.motion3.json"],
    "error": ["sad.motion3.json"],
    "sleep": ["sleep.motion3.json"]
  },
  "lipSync": {
    "enabled": true,
    "parameterName": "ParamMouthOpenY",
    "smoothing": 0.3
  }
}
```

### 4. Configure Model Path

In `src/renderer/components/CharacterRenderer.tsx`, update the model loading code:

```typescript
// Replace this line in the loadModel function:
throw new Error('Live2D model not configured...');

// With:
const modelPath = '/path/to/your/model.model3.json';
const model = await Live2DModel.from(modelPath);

// ... rest of the code
```

### 5. Test the Integration

Run the app and verify:
- Model loads without errors
- Character appears on screen
- Dragging works
- State changes trigger animations

## Directory Structure

For packaged characters:

```
userData/characters/
└── my-character/
    ├── character.json
    ├── model.model3.json
    ├── model.moc3
    ├── textures/
    │   ├── texture_00.png
    │   └── ...
    ├── motions/
    │   ├── idle_01.motion3.json
    │   └── ...
    └── expressions/
        └── ...
```

## Troubleshooting

### Model doesn't load
- Check console for errors
- Verify model file paths are correct
- Ensure model format is supported (Cubism 2/3/4)

### Animations don't play
- Check motion files exist in manifest
- Verify motion group names match MaidState values
- Look for console warnings about missing motions

### Lip sync not working
- Verify `lipSync.enabled` is true
- Check `parameterName` matches your model's mouth parameter
- Test TTS audio is playing correctly

## Sample Models

For testing, you can use free Live2D sample models:
- [Live2D Official Samples](https://www.live2d.com/download/sample-data/)
- [Cubism SDK Samples](https://github.com/Live2D/CubismWebSamples)

## Next Steps

Once basic rendering works:
1. Implement character import/export via IPC
2. Add character selection UI in settings
3. Integrate lip sync with TTS audio queue
4. Add physics and breathing animations
5. Support multiple character switching

## Resources

- [pixi-live2d-display Documentation](https://github.com/guansss/pixi-live2d-display)
- [Live2D Cubism Documentation](https://docs.live2d.com/)
- [PixiJS Documentation](https://pixijs.download/release/docs/index.html)
