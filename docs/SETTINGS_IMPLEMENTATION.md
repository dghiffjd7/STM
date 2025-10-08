# Settings Implementation Guide

## Status: 🚧 In Progress

### ✅ Completed

1. **Config Schema & Storage**
   - `STMConfig` type with version: 1
   - Sections: `ai`, `tts`, `permissions`, `shortcuts`, `appearance`, `profiles`
   - Migration system in `config.ts:migrateConfig()`
   - electron-store for non-sensitive data

2. **Secret Management**
   - `secrets.ts` - keytar with encrypted fallback
   - Separate storage: `provider:kind` → encrypted value
   - API: `setSecret()`, `getSecret()`, `getSecretStatus()`

3. **IPC Layer**
   - `config.get/set` - STMConfig operations
   - `secret.set/status` - Secret management
   - `config.testConnection` - Live provider test
   - `config.{save|delete|apply}Profile` - Profile management
   - `config.{export|import}` - Sanitized config transfer

4. **Provider Integration**
   - Updated all adapters to receive `AIConfig` with secrets
   - `ai.ts` uses `getAIConfigWithSecrets()` for runtime
   - `testConnection()` reuses same adapter pathway

### 🔨 Remaining Work

#### 1. Renderer Hooks (`src/renderer/hooks/useConfig.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { STMConfig, SecretSetRequest, SecretStatus } from '@/shared/types';

export function useConfig() {
  const [config, setConfig] = useState<STMConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  const refresh = useCallback(async () => {
    const data = await window.config.get();
    setConfig(data);
    setLoading(false);
    setDirty(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = useCallback(async (patch: Partial<STMConfig>) => {
    await window.config.set(patch);
    setDirty(true);
    await refresh();
  }, [refresh]);

  const setSecretValue = useCallback(async (req: SecretSetRequest) => {
    await window.secret.set(req);
    await refresh();
  }, [refresh]);

  const getSecretStatus = useCallback(async (provider: string): Promise<SecretStatus> => {
    return await window.secret.status(provider);
  }, []);

  const testConnection = useCallback(async () => {
    return await window.config.testConnection();
  }, []);

  return {
    config,
    loading,
    dirty,
    update,
    refresh,
    setSecretValue,
    getSecretStatus,
    testConnection,
    // Profile methods
    saveProfile: window.config.saveProfile,
    deleteProfile: window.config.deleteProfile,
    applyProfile: window.config.applyProfile,
    exportConfig: window.config.export,
    importConfig: window.config.import,
  };
}
```

#### 2. Settings UI Structure

**SettingsRoot** (`src/renderer/components/settings/SettingsRoot.tsx`):
- Left sidebar: Tabs for each section
- Right panel: Selected section content
- Use Radix UI `<Tabs>` for navigation
- Modal/Sheet overlay (close with Esc or X button)

**Sections** (`src/renderer/components/settings/sections/`):

1. **LLMSection.tsx**
   - Provider select (openai_compat | anthropic | gemini)
   - Model input + suggested dropdown
   - Temperature/top_p/max_tokens sliders
   - System prompt textarea
   - Test Connection button → shows latency/status

2. **SecretsSection.tsx**
   - Conditional forms based on `config.ai.provider`:
     - `openai_compat`: Base URL + API Key
     - `anthropic`: API Key
     - `gemini`:
       - Mode toggle (API Key / Vertex)
       - If API Key: Gemini API Key field
       - If Vertex: Project ID, Location, SA JSON Path
   - Show "•••• Saved" if `hasApiKey === true`
   - Save button → `setSecretValue({ provider, kind, value })`

3. **ProfilesSection.tsx**
   - List all `config.profiles`
   - "Save Current as Profile" button
   - Each profile: Name, Apply button, Delete button
   - Apply → `applyProfile(id)` → confirm diff modal

4. **Other Sections** (TTS, Permissions, Shortcuts, Appearance):
   - Simple form inputs mapped to `config.{section}`
   - On change → `update({ [section]: newValue })`

#### 3. Styling (ST-like)

**Card Component**:
```tsx
<div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 space-y-4">
  {/* Form fields */}
</div>
```

**Form Row**:
```tsx
<div className="flex items-center justify-between">
  <label className="text-sm font-medium">Temperature</label>
  <input type="range" className="w-48" />
</div>
```

**Danger Actions** (red border + confirmation):
```tsx
<button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
  Delete Profile
</button>
```

#### 4. Integration with Main UI

**Add Settings Button** (in `src/renderer/App.tsx` or PromptBar):
```tsx
<button
  onClick={() => setShowSettings(true)}
  className="fixed top-4 right-4 p-2 rounded-full bg-white/90 shadow-lg"
>
  <SettingsIcon />
</button>

{showSettings && <SettingsRoot onClose={() => setShowSettings(false)} />}
```

**Global Shortcut** (`Alt+,` triggers settings):
- Already registered in main process
- Emit event to renderer → `setShowSettings(true)`

### 🔐 Security Checklist

- ✅ Secrets never sent to renderer (only status flags)
- ✅ `export()` redacts all `[REDACTED]` fields
- ✅ `import()` ignores redacted fields
- ✅ Profiles sanitized on save/export
- ✅ Service Account JSON only stores path, not content

### 🧪 Testing Flow

1. **First Launch**:
   - Open Settings (Alt+,)
   - Select Provider → Enter API Key → Test Connection
   - Should show "Connection successful" + latency

2. **Profile Workflow**:
   - Configure LLM settings
   - Click "Save as Profile" → Name it "Fast GPT-4"
   - Change to different model
   - Apply "Fast GPT-4" → Settings revert

3. **Import/Export**:
   - Export config → Check JSON has `[REDACTED]` for keys
   - Import config → Secrets remain unchanged

### 📝 Implementation Order

1. ✅ Config types & storage
2. ✅ Secret management
3. ✅ IPC handlers
4. ✅ Preload bridge
5. ⏳ `useConfig` hook (15 min)
6. ⏳ `SettingsRoot` + tabs (30 min)
7. ⏳ `LLMSection` + `SecretsSection` (45 min)
8. ⏳ `ProfilesSection` (30 min)
9. ⏳ Other sections (1 hour)
10. ⏳ Integrate with main UI (15 min)

**Total Remaining:** ~3-4 hours

### 🎯 Next Steps

Run:
```bash
npm install keytar  # For system keychain support
npm run build:main
npm run dev
```

Then implement the renderer components following the structure above.

---

**Key Files to Create:**
- `src/renderer/hooks/useConfig.ts`
- `src/renderer/components/settings/SettingsRoot.tsx`
- `src/renderer/components/settings/sections/*.tsx`

All backend infrastructure is ready. Settings UI is the final piece!
