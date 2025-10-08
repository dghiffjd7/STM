import { useState, useEffect } from 'react';
import type { Provider } from '../../../shared/types';
 
interface SecretsSectionProps {
  config: any;
  toast: any;
}

export function SecretsSection({ config, toast }: SecretsSectionProps) {
  const [status, setStatus] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [minimaxStatus, setMinimaxStatus] = useState<any>(null);
  const [minimaxApiKey, setMinimaxApiKey] = useState('');
  const [minimaxGroupId, setMinimaxGroupId] = useState('');

  const provider = config.config?.ai.provider as Provider;
  const ai = config.config?.ai;

  useEffect(() => {
    if (provider) {
      config.getSecretStatus(provider).then(setStatus);
    }
    // Load Minimax status separately (always needed for TTS)
    config.getSecretStatus('minimax').then(setMinimaxStatus);
  }, [provider, config]);

  const handleSaveSecret = async (kind: string, value: string) => {
    if (!value.trim()) {
      toast.error('Please enter a value');
      return;
    }

    const result = await config.setSecretValue(provider, kind, value);

    if (result.success) {
      toast.success('Secret saved');
      setApiKey('');
      setGeminiApiKey('');
      const newStatus = await config.getSecretStatus(provider);
      setStatus(newStatus);
    } else {
      toast.error(result.error || 'Failed to save secret');
    }
  };

  const handleUpdateNonSecret = async (field: string, value: any) => {
    const result = await config.update({
      ai: {
        ...ai,
        [field]: value,
      },
    });

    if (result.success) {
      toast.success('Settings updated');
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  const handleSaveMinimaxSecret = async (kind: string, value: string) => {
    if (!value.trim()) {
      toast.error('Please enter a value');
      return;
    }

    const result = await config.setSecretValue('minimax', kind, value);

    if (result.success) {
      toast.success('Minimax secret saved');
      setMinimaxApiKey('');
      setMinimaxGroupId('');
      const newStatus = await config.getSecretStatus('minimax');
      setMinimaxStatus(newStatus);
    } else {
      toast.error(result.error || 'Failed to save secret');
    }
  };

  return (
    <div className="space-y-6">
      {provider === 'openai_compat' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">OpenAI-Compatible Settings</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Base URL</label>
              <input
                type="text"
                value={ai?.openaiCompat?.baseUrl || ''}
                onChange={(e) =>
                  handleUpdateNonSecret('openaiCompat', {
                    ...ai?.openaiCompat,
                    baseUrl: e.target.value,
                  })
                }
                placeholder="https://api.openai.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                For DeepSeek, use https://api.deepseek.com; for Grok, use https://api.x.ai
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={status?.hasApiKey ? '•••• Saved' : 'sk-...'}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => handleSaveSecret('apiKey', apiKey)}
                  disabled={!apiKey.trim()}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {provider === 'anthropic' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Anthropic Settings</h3>

          <div>
            <label className="block text-sm font-medium mb-2">API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={status?.hasApiKey ? '•••• Saved' : 'sk-ant-...'}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={() => handleSaveSecret('apiKey', apiKey)}
                disabled={!apiKey.trim()}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {provider === 'gemini' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Gemini Mode</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Authentication Mode</label>
              <select
                value={ai?.gemini?.useVertex ? 'vertex' : 'apikey'}
                onChange={(e) =>
                  handleUpdateNonSecret('gemini', {
                    ...ai?.gemini,
                    useVertex: e.target.value === 'vertex',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="apikey">API Key</option>
                <option value="vertex">Vertex AI (Service Account)</option>
              </select>
            </div>
          </div>

          {!ai?.gemini?.useVertex ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Gemini API Key</h3>

              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder={status?.hasGeminiApiKey ? '•••• Saved' : 'AIza...'}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={() => handleSaveSecret('geminiApiKey', geminiApiKey)}
                    disabled={!geminiApiKey.trim()}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Vertex AI Settings</h3>

              <div>
                <label className="block text-sm font-medium mb-2">Project ID</label>
                <input
                  type="text"
                  value={ai?.gemini?.projectId || ''}
                  onChange={(e) =>
                    handleUpdateNonSecret('gemini', {
                      ...ai?.gemini,
                      projectId: e.target.value,
                    })
                  }
                  placeholder="my-project-123"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={ai?.gemini?.location || ''}
                  onChange={(e) =>
                    handleUpdateNonSecret('gemini', {
                      ...ai?.gemini,
                      location: e.target.value,
                    })
                  }
                  placeholder="us-central1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Service Account JSON Path
                </label>
                <input
                  type="text"
                  value={ai?.gemini?.serviceAccountJsonPath || ''}
                  onChange={(e) =>
                    handleUpdateNonSecret('gemini', {
                      ...ai?.gemini,
                      serviceAccountJsonPath: e.target.value,
                    })
                  }
                  placeholder="/path/to/service-account.json"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Path to your GCP service account JSON file (stored locally, not uploaded)
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Minimax TTS Configuration (always shown) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Minimax TTS</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure Minimax Text-to-Speech for voice output
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={minimaxApiKey}
              onChange={(e) => setMinimaxApiKey(e.target.value)}
              placeholder={minimaxStatus?.hasApiKey ? '•••• Saved' : 'Enter API key'}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() => handleSaveMinimaxSecret('apiKey', minimaxApiKey)}
              disabled={!minimaxApiKey.trim()}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Group ID</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={minimaxGroupId}
              onChange={(e) => setMinimaxGroupId(e.target.value)}
              placeholder={minimaxStatus?.hasGroupId ? '•••• Saved' : 'Enter group ID'}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() => handleSaveMinimaxSecret('groupId', minimaxGroupId)}
              disabled={!minimaxGroupId.trim()}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your Minimax Group ID (required for TTS API)
          </p>
        </div>
      </div>
    </div>
  );
}
