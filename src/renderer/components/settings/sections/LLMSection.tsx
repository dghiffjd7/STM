import { useState } from 'react';
import type { Provider } from '../../../shared/types';
 
interface LLMSectionProps {
  config: any;
  toast: any;
}

const PROVIDERS = [
  { value: 'openai_compat' as Provider, label: 'OpenAI-Compatible' },
  { value: 'anthropic' as Provider, label: 'Anthropic (Claude)' },
  { value: 'gemini' as Provider, label: 'Gemini' },
];

const SUGGESTED_MODELS: Record<Provider, string[]> = {
  openai_compat: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'deepseek-chat', 'grok-beta'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
};

export function LLMSection({ config, toast }: LLMSectionProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const ai = config.config?.ai;
  const provider = ai?.provider || 'openai_compat';

  const handleUpdate = async (field: string, value: any) => {
    const result = await config.update({
      ai: {
        ...ai,
        [field]: value,
      },
    });

    if (result.success) {
      toast.success('LLM settings updated');
    } else {
      toast.error(result.error || 'Failed to update settings');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const result = await config.testConnection();
    setTestResult(result);
    setTesting(false);

    if (result.ok) {
      toast.success(`Connected successfully (${result.latencyMs}ms)`);
    } else {
      toast.error(result.message || 'Connection failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Provider & Model</h3>

        <div>
          <label className="block text-sm font-medium mb-2">Provider</label>
          <select
            value={provider}
            onChange={(e) => handleUpdate('provider', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {provider === 'openai_compat' && 'Works with OpenAI, DeepSeek, Grok, OpenRouter, etc.'}
            {provider === 'anthropic' && 'Anthropic Claude models'}
            {provider === 'gemini' && 'Google Gemini models (API Key or Vertex AI)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Model</label>
          <input
            type="text"
            value={ai?.model || ''}
            onChange={(e) => handleUpdate('model', e.target.value)}
            list="model-suggestions"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter model name"
          />
          <datalist id="model-suggestions">
            {SUGGESTED_MODELS[provider]?.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Parameters</h3>

        <div>
          <label className="block text-sm font-medium mb-2">
            Temperature: {ai?.temperature?.toFixed(1) || '0.7'}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={ai?.temperature || 0.7}
            onChange={(e) => handleUpdate('temperature', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Top P: {ai?.top_p?.toFixed(2) || '1.00'}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ai?.top_p || 1.0}
            onChange={(e) => handleUpdate('top_p', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Max Tokens</label>
            <input
              type="number"
              min="1"
              max="32000"
              value={ai?.max_tokens || 2048}
              onChange={(e) => handleUpdate('max_tokens', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
            <input
              type="number"
              min="5000"
              max="120000"
              step="1000"
              value={ai?.timeoutMs || 30000}
              onChange={(e) => handleUpdate('timeoutMs', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">System Prompt</label>
          <textarea
            value={ai?.systemPrompt || ''}
            onChange={(e) => handleUpdate('systemPrompt', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            placeholder="You are a helpful assistant..."
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Connection Test</h3>

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? 'Testing Connection...' : 'Test Connection'}
        </button>

        {testResult && (
          <div
            className={`p-3 rounded-lg ${
              testResult.ok
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{testResult.ok ? '✓' : '✗'}</span>
              <span className="font-medium">
                {testResult.ok ? 'Connected' : 'Failed'}
              </span>
              {testResult.latencyMs && <span>({testResult.latencyMs}ms)</span>}
            </div>
            {testResult.message && (
              <p className="text-sm mt-1">{testResult.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
