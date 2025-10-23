# STM (Silly Tavern Maid)

A desktop AI companion that lives on your screen, powered by LLM and TTS.

## Features

- **Live2D Character**: Fully animated Live2D Cubism 4 model support
- **Desktop Pet**: Draggable, interactive character with state-based animations
- **AI Chat**: Stream responses from LLM with Silly Tavern-style interface
- **Text-to-Speech**: Minimax TTS integration for voice playback
- **Desktop Actions**: Execute file operations and system commands (with permission)
- **Secure**: Context isolation, sandboxed renderer, permission system

## Tech Stack

- **Electron 30+** - Cross-platform desktop framework
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **PixiJS + pixi-live2d-display** - Live2D Cubism 4 rendering

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
npm run dist
```

### Project Structure

```
src/
├── main/          # Electron main process (Node.js)
├── renderer/      # React UI (browser context)
├── preload/       # IPC bridge (context isolation)
└── shared/        # Shared types and constants
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Choose your AI provider
# Option 1: OpenAI-Compatible (OpenAI, DeepSeek, Grok, OpenRouter, etc.)
STM_OPENAI_BASE_URL=https://api.openai.com
STM_OPENAI_API_KEY=sk-...
STM_OPENAI_MODEL=gpt-4o-mini

# Option 2: Anthropic (Claude)
# Set provider to 'anthropic' in config, use same API_KEY field

# Option 3: Gemini - API Key Mode
STM_GEMINI_API_KEY=your_key_here

# Option 4: Gemini - Vertex AI Mode
STM_GEMINI_PROJECT_ID=your-project-id
STM_GEMINI_LOCATION=us-central1
STM_GEMINI_SA_JSON_PATH=/path/to/service-account.json

# Minimax TTS
STM_MINIMAX_API_KEY=your_minimax_key
```

### Switching Providers

To switch between AI providers, update the config via the UI or directly edit the electron-store config file:

- **OpenAI/DeepSeek/Grok**: `provider: 'openai_compat'` - Just change `baseUrl` and `apiKey`
- **Anthropic (Claude)**: `provider: 'anthropic'` - Uses `apiKey` field
- **Gemini**: `provider: 'gemini'` - Configure `gemini.useVertex` and credentials

All providers use the same streaming interface - no code changes needed!

## Live2D Character

The project comes with a test character (Epsilon) in `model/Epsilon_free/`. 

### Character Structure

```
model/
└── YourCharacter/
    └── runtime/
        ├── character.json          # STM manifest
        ├── YourModel.model3.json   # Live2D model definition
        ├── YourModel.moc3          # Compiled model data
        ├── YourModel.2048/         # Textures
        │   └── texture_00.png
        ├── motion/                 # Animation files
        └── expressions/            # Facial expressions
```

### Troubleshooting

If the character doesn't load:

1. **Check Console** (F12): Look for error messages
2. **Verify Files**: Ensure all model files exist
3. **See Documentation**: Check `LIVE2D_FIXED_20251020.md` for detailed troubleshooting

Common issues:
- **"Could not find Cubism runtime"**: Missing dependencies, run `npm install`
- **"Failed to fetch"**: Check file paths and permissions
- **White/black model**: Texture files missing or corrupted

## Permissions

STM uses a granular permission system:
- `fs.read` - Read files
- `fs.write` - Write/move/copy files
- `fs.delete` - Delete files
- `sys.open` - Open files/URLs
- `sys.clipboard` - Access clipboard
- `sys.shortcut` - Register global shortcuts

All actions are logged to audit files.

## Roadmap

### Week 1: Foundation ✅
- [x] Project setup
- [x] Transparent window & click-through
- [x] Basic maid state machine
- [x] IPC architecture

### Week 2: AI & TTS ✅
- [x] LLM API integration (OpenAI-compatible, Anthropic, Gemini)
- [x] Multi-provider architecture with single streaming interface
- [x] Streaming chat UI with typewriter effect
- [x] Live2D Cubism 4 integration
- [ ] Minimax TTS integration
- [ ] Audio playback queue

### Week 3: Commands & Permissions
- [ ] Command parser (slash + natural language)
- [ ] File system operations
- [ ] Permission dialogs
- [ ] Audit logging

### Week 4: Polish & Package
- [ ] Lip sync with TTS audio
- [ ] Expression system
- [ ] Character management UI
- [ ] First-run wizard
- [ ] Packaging & installers

## Documentation

- `LIVE2D_FIXED_20251020.md` - Live2D integration and troubleshooting
- `docs/` - Technical documentation
- `claude.md` - Development guidelines

## License

MIT
