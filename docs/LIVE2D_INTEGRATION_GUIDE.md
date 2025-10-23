# Live2D Integration Complete Guide

## 🎉 Current Status

✅ **Framework Complete & Ready for Testing**

All infrastructure is in place:
- Pixi.js v6 aligned with pixi-live2d-display
- Full PIXI namespace exposed to window
- Character IPC handlers implemented
- Manifest loading pipeline complete
- useCharacterMotion hook connected
- Config migration for characters section

## 📋 Quick Start Checklist

### 1. Prepare a Live2D Model

Download a free Live2D sample model:
- [Live2D Official Samples](https://www.live2d.com/download/sample-data/)
- [Cubism SDK Samples](https://github.com/Live2D/CubismWebSamples)

Recommended for testing: **Haru** or **Hiyori** (Cubism 3.x models)

### 2. Set Up Character Directory

Create directory structure:
```
%APPDATA%/stm/characters/example-maid/
├── character.json
├── model.model3.json
├── *.moc3
├── textures/
│   └── *.png
└── motions/
    └── *.motion3.json
```

Or use the example template at `/mnt/d/STM/example-character/character.json`

### 3. Create character.json

```json
{
  "id": "example-maid",
  "name": "Example Maid",
  "version": "1.0.0",
  "model": {
    "path": "./Haru.model3.json",
    "scale": 1.0,
    "position": { "x": 0, "y": 0 }
  },
  "motions": {
    "idle": ["Idle"],
    "hover": ["TapBody"],
    "drag": ["Shake"],
    "speak": ["TapBody"],
    "think": ["Idle"],
    "error": ["Shake"],
    "sleep": ["Idle"]
  },
  "lipSync": {
    "enabled": true,
    "parameterName": "ParamMouthOpenY",
    "smoothing": 0.3
  }
}
```

**Important**: Motion names must match the groups defined in your .model3.json file.

### 4. Enable Live2D in Code

In `src/renderer/components/Maid.tsx:12`, change:
```typescript
const USE_LIVE2D = false;
```
to:
```typescript
const USE_LIVE2D = true;
```

### 5. Rebuild and Test

```bash
npm run build:main
npm run build:preload
npm run dev
```

## 🔍 Troubleshooting

### Model doesn't load

**Check console for errors:**

1. **"Failed to load character manifest"**
   - Verify character.json exists in correct path
   - Check JSON syntax is valid
   - Ensure characterId matches directory name

2. **"Failed to fetch"**
   - Check .model3.json path in character.json
   - Ensure all texture/motion paths are relative to character directory
   - Verify file paths use forward slashes `/` not backslashes

3. **"Texture not found"**
   - Check texture paths in .model3.json
   - Ensure texture files exist in textures/ directory
   - Verify file extensions match exactly (case-sensitive)

### Motions don't play

1. **Check motion group names**
   - Open your .model3.json file
   - Find the "Motions" section
   - Update character.json to use exact group names

Example from Haru model:
```json
"Motions": {
  "Idle": [ { "File": "motions/Idle.motion3.json" } ],
  "TapBody": [ { "File": "motions/TapBody.motion3.json" } ]
}
```

Your character.json should match:
```json
"motions": {
  "idle": ["Idle"],    // matches "Idle" group
  "hover": ["TapBody"]  // matches "TapBody" group
}
```

2. **Check console logs**
   - Look for "[CharacterMotion] Playing motion for state..."
   - If you see warnings about missing motions, update your mapping

### Model appears but is tiny/huge

Adjust scale in character.json:
```json
"model": {
  "scale": 1.5,  // Try values between 0.5 - 2.0
  "position": { "x": 0, "y": 0 }
}
```

### Model is off-center

Adjust position offset:
```json
"model": {
  "scale": 1.0,
  "position": { "x": -50, "y": 20 }  // Negative x = left, positive y = down
}
```

## 🔧 Advanced Configuration

### Custom Motion Mapping

You can map multiple motions to one state for variety:
```json
"motions": {
  "idle": ["Idle", "Idle_02", "Idle_03"],
  "speak": ["TapBody", "TapMouth"]
}
```

The system will randomly pick one each time the state changes.

### Lip Sync Parameters

Common parameter names:
- `ParamMouthOpenY` - Most models
- `PARAM_MOUTH_OPEN_Y` - Cubism 2.x models
- `Mouth` - Some custom models

Check your model's parameters:
1. Open .model3.json
2. Find "Parameters" section
3. Look for mouth-related parameter

### Expression Support (Future)

The framework supports expressions, but UI is not implemented yet:
```json
"expressions": {
  "happy": "exp_happy.exp3.json",
  "sad": "exp_sad.exp3.json"
}
```

## 📊 Performance Tips

1. **Use Cubism 3.x models** - Better performance than 4.x for Electron
2. **Limit texture size** - Max 2048x2048 recommended
3. **Reduce motion complexity** - Fewer parameters = better FPS
4. **Monitor FPS** - Check DevTools Performance tab

## 🎨 Recommended Test Models

### Beginner-Friendly Models
1. **Haru** (Cubism 3.x)
   - Simple rigging
   - Clear motion groups
   - Good for first test

2. **Hiyori** (Cubism 3.x)
   - Medium complexity
   - More expressions
   - Good for testing features

### Where to Find
- [Live2D Official Samples](https://www.live2d.com/download/sample-data/)
- Download "Cubism 3 SDK" or "Cubism 4 SDK"
- Extract model files from Samples/Resources/

## 📝 Current Limitations

- ❌ No character import/export UI yet (manual setup required)
- ❌ No character switching UI (hardcoded to config.characters.currentCharacterId)
- ❌ Lip sync not connected to TTS audio queue yet
- ❌ No physics simulation
- ❌ No expression switching

## 🚀 Next Development Steps

### Phase 1: Basic Rendering (✅ COMPLETE)
- [x] Install dependencies
- [x] Create CharacterRenderer component
- [x] Implement manifest loading
- [x] Connect state-to-motion mapping
- [ ] **Test with real model** ← YOU ARE HERE

### Phase 2: Lip Sync
- [ ] Connect useLipSync to audio queue
- [ ] Test with TTS playback
- [ ] Verify mouth parameter updates

### Phase 3: Character Management
- [ ] Create CharactersSection UI
- [ ] Implement character import (zip)
- [ ] Add character switching
- [ ] Generate thumbnails

### Phase 4: Polish
- [ ] Add physics/breathing
- [ ] Implement expressions
- [ ] Performance optimization
- [ ] Error boundaries

## 🆘 Getting Help

If you encounter issues:

1. **Check Console Logs**
   - Look for `[CharacterRenderer]` and `[CharacterMotion]` prefixes
   - Copy full error messages

2. **Verify File Structure**
   ```bash
   # On Windows, check:
   %APPDATA%/stm/characters/

   # Should see:
   example-maid/
   ├── character.json
   ├── Haru.model3.json
   └── ...
   ```

3. **Test with Sample Model**
   - Use official Live2D samples first
   - Don't modify file structure
   - Follow naming exactly

4. **Check IPC Communication**
   - Open DevTools
   - Network tab should show no errors
   - Console should show "[character] IPC handlers registered"

## 📚 Reference Documentation

- [pixi-live2d-display GitHub](https://github.com/guansss/pixi-live2d-display)
- [Live2D Cubism Docs](https://docs.live2d.com/)
- [PixiJS v6 Docs](https://pixijs.download/v6.x/docs/index.html)

## 🎯 Success Criteria

You'll know it's working when:

1. ✅ App starts without console errors
2. ✅ DevTools shows "[CharacterRenderer] Loading model from..."
3. ✅ DevTools shows "[CharacterRenderer] Model loaded successfully"
4. ✅ Live2D character appears on screen
5. ✅ Character animates when you hover/drag
6. ✅ Character state label shows current state
7. ✅ No texture loading errors in console

Good luck! 🎉
