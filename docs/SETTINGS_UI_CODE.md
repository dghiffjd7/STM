# Settings UI Implementation Code

## Status: Ready to Implement

### ✅ Completed Infrastructure
- useConfig hook (src/renderer/hooks/useConfig.ts)
- Toast notifications (src/renderer/components/Toast.tsx + useToast hook)

### 📝 Components to Create

#### 1. SettingsRoot.tsx

```tsx
import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useConfig } from '../hooks/useConfig';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import { LLMSection } from './settings/sections/LLMSection';
import { SecretsSection } from './settings/sections/SecretsSection';
import { ProfilesSection } from './settings/sections/ProfilesSection';
// Import other sections...

interface SettingsRootProps {
  onClose: () => void;
}

export function SettingsRoot({ onClose }: SettingsRootProps) {
  const config = useConfig();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('llm');

  const handleExport = async () => {
    const json = await config.exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stm-config.json';
    a.click();
    toast.success('Config exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const result = await config.importConfig(text);
        if (result.success) {
          toast.success('Config imported');
        } else {
          toast.error(result.error || 'Import failed');
        }
      }
    };
    input.click();
  };

  if (config.loading) return <div>Loading...</div>;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 w-[900px] h-[700px] rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Settings</h2>
          <div className="flex gap-2">
            <button onClick={handleExport} className="px-3 py-1 text-sm bg-gray-200 rounded-lg hover:bg-gray-300">
              Export
            </button>
            <button onClick={handleImport} className="px-3 py-1 text-sm bg-gray-200 rounded-lg hover:bg-gray-300">
              Import
            </button>
            <button onClick={onClose} className="px-3 py-1 text-sm bg-gray-200 rounded-lg hover:bg-gray-300">
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex overflow-hidden">
          <Tabs.List className="w-48 border-r border-gray-200 dark:border-gray-700 p-4 space-y-1">
            <Tabs.Trigger value="llm" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              LLM
            </Tabs.Trigger>
            <Tabs.Trigger value="secrets" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Secrets
            </Tabs.Trigger>
            <Tabs.Trigger value="profiles" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Profiles
            </Tabs.Trigger>
            <Tabs.Trigger value="tts" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              TTS
            </Tabs.Trigger>
            <Tabs.Trigger value="permissions" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Permissions
            </Tabs.Trigger>
            <Tabs.Trigger value="shortcuts" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Shortcuts
            </Tabs.Trigger>
            <Tabs.Trigger value="appearance" className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Appearance
            </Tabs.Trigger>
          </Tabs.List>

          <div className="flex-1 overflow-y-auto p-6">
            <Tabs.Content value="llm"><LLMSection config={config} toast={toast} /></Tabs.Content>
            <Tabs.Content value="secrets"><SecretsSection config={config} toast={toast} /></Tabs.Content>
            <Tabs.Content value="profiles"><ProfilesSection config={config} toast={toast} /></Tabs.Content>
            {/* Other tabs... */}
          </div>
        </Tabs.Root>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
    </div>
  );
}
```

#### 2. LLMSection.tsx

```tsx
import { useState } from 'react';

const PROVIDERS = [
  { value: 'openai_compat', label: 'OpenAI-Compatible' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Gemini' },
];

const SUGGESTED_MODELS = {
  openai_compat: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'deepseek-chat', 'grok-beta'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
};

export function LLMSection({ config, toast }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const provider = config.config?.ai.provider || 'openai_compat';
  const ai = config.config?.ai;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await config.testConnection();
    setTestResult(result);
    setTesting(false);
    if (result.ok) {
      toast.success(`Connected (${result.latencyMs}ms)`);
    } else {
      toast.error(result.message || 'Connection failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Provider</h3>

        <div>
          <label className="block text-sm font-medium mb-2">Provider</label>
          <select
            value={provider}
            onChange={(e) => config.update({ ai: { ...ai, provider: e.target.value } })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Model</label>
          <input
            type="text"
            value={ai?.model || ''}
            onChange={(e) => config.update({ ai: { ...ai, model: e.target.value } })}
            list="model-suggestions"
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Enter model name"
          />
          <datalist id="model-suggestions">
            {SUGGESTED_MODELS[provider]?.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Temperature: {ai?.temperature}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={ai?.temperature || 0.7}
              onChange={(e) => config.update({ ai: { ...ai, temperature: parseFloat(e.target.value) } })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Tokens</label>
            <input
              type="number"
              value={ai?.max_tokens || 2048}
              onChange={(e) => config.update({ ai: { ...ai, max_tokens: parseInt(e.target.value) } })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={handleTest}
          disabled={testing}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        {testResult && (
          <div className={`p-3 rounded-lg ${testResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {testResult.ok ? '✓ Connected' : '✗ Failed'} - {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 3. SecretsSection.tsx

```tsx
import { useState, useEffect } from 'react';

export function SecretsSection({ config, toast }) {
  const [status, setStatus] = useState(null);
  const provider = config.config?.ai.provider;

  useEffect(() => {
    if (provider) {
      config.getSecretStatus(provider).then(setStatus);
    }
  }, [provider, config]);

  const handleSave = async (kind, value) => {
    const result = await config.setSecretValue(provider, kind, value);
    if (result.success) {
      toast.success('Secret saved');
      const newStatus = await config.getSecretStatus(provider);
      setStatus(newStatus);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">API Credentials</h3>

        {provider === 'openai_compat' && (
          <>
            <SecretInput
              label="Base URL"
              kind="baseUrl"
              value={config.config?.ai.openaiCompat?.baseUrl}
              onSave={(val) => config.update({ ai: { ...config.config.ai, openaiCompat: { baseUrl: val } } })}
              placeholder="https://api.openai.com"
            />
            <SecretInput
              label="API Key"
              kind="apiKey"
              saved={status?.hasApiKey}
              onSave={(val) => handleSave('apiKey', val)}
              placeholder="sk-..."
              type="password"
            />
          </>
        )}

        {provider === 'anthropic' && (
          <SecretInput
            label="API Key"
            kind="apiKey"
            saved={status?.hasApiKey}
            onSave={(val) => handleSave('apiKey', val)}
            placeholder="sk-ant-..."
            type="password"
          />
        )}

        {provider === 'gemini' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Mode</label>
              <select
                value={config.config?.ai.gemini.useVertex ? 'vertex' : 'apikey'}
                onChange={(e) => config.update({
                  ai: { ...config.config.ai, gemini: { ...config.config.ai.gemini, useVertex: e.target.value === 'vertex' } }
                })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="apikey">API Key</option>
                <option value="vertex">Vertex AI</option>
              </select>
            </div>

            {!config.config?.ai.gemini.useVertex ? (
              <SecretInput
                label="Gemini API Key"
                kind="geminiApiKey"
                saved={status?.hasGeminiApiKey}
                onSave={(val) => handleSave('geminiApiKey', val)}
                placeholder="AIza..."
                type="password"
              />
            ) : (
              <>
                <SecretInput
                  label="Project ID"
                  kind="projectId"
                  value={config.config?.ai.gemini.projectId}
                  onSave={(val) => config.update({
                    ai: { ...config.config.ai, gemini: { ...config.config.ai.gemini, projectId: val } }
                  })}
                  placeholder="my-project-123"
                />
                <SecretInput
                  label="Location"
                  kind="location"
                  value={config.config?.ai.gemini.location}
                  onSave={(val) => config.update({
                    ai: { ...config.config.ai, gemini: { ...config.config.ai.gemini, location: val } }
                  })}
                  placeholder="us-central1"
                />
                <SecretInput
                  label="Service Account JSON Path"
                  kind="saPath"
                  value={config.config?.ai.gemini.serviceAccountJsonPath}
                  onSave={(val) => config.update({
                    ai: { ...config.config.ai, gemini: { ...config.config.ai.gemini, serviceAccountJsonPath: val } }
                  })}
                  placeholder="/path/to/sa.json"
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SecretInput({ label, saved, onSave, placeholder, type = 'text', value, kind }) {
  const [input, setInput] = useState('');

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type={type}
          value={value !== undefined ? value : input}
          onChange={(e) => value !== undefined ? onSave(e.target.value) : setInput(e.target.value)}
          placeholder={saved ? '•••• Saved' : placeholder}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        {value === undefined && (
          <button
            onClick={() => { onSave(input); setInput(''); }}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
}
```

### 📦 Install Radix UI

```bash
npm install @radix-ui/react-tabs @radix-ui/react-dialog
```

### 🎯 Next Steps

1. Create remaining sections (Profiles, TTS, Permissions, Shortcuts, Appearance)
2. Add settings button to App.tsx
3. Handle keyboard shortcut (Alt+,) to open settings

**Estimated time:** 2-3 hours to complete all sections
