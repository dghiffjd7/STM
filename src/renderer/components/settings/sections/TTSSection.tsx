import { useState, useEffect } from 'react';

interface TTSSectionProps {
  config: any;
  toast: any;
}

const VOICE_OPTIONS = [
  { value: 'female-tianmei', label: 'Female - Tianmei' },
  { value: 'female-shaonv', label: 'Female - Shaonv' },
  { value: 'male-qn-qingse', label: 'Male - Qingse' },
  { value: 'male-qn-jingying', label: 'Male - Jingying' },
];

export function TTSSection({ config, toast }: TTSSectionProps) {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasGroupId, setHasGroupId] = useState(false);

  const tts = config.config?.tts;

  useEffect(() => {
    // Check if Minimax credentials are configured
    const checkCredentials = async () => {
      try {
        const status = await config.getSecretStatus('minimax');
        setHasApiKey(status.hasApiKey);
        setHasGroupId(status.hasGroupId);
      } catch (err) {
        console.error('Failed to check Minimax credentials status:', err);
      }
    };
    checkCredentials();
  }, [config]);

  const handleUpdate = async (field: string, value: any) => {
    const result = await config.update({
      tts: {
        ...tts,
        [field]: value,
      },
    });

    if (result.success) {
      toast.success('TTS settings updated');
    } else {
      toast.error(result.error || 'Failed to update settings');
    }
  };

  const isConfigured = hasApiKey && hasGroupId;

  return (
    <div className="space-y-6">
      {/* Minimax Credentials Status */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Minimax TTS Configuration</h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                hasApiKey ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm">
              API Key: {hasApiKey ? 'Configured' : 'Not configured'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                hasGroupId ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm">
              Group ID: {hasGroupId ? 'Configured' : 'Not configured'}
            </span>
          </div>
        </div>

        {!isConfigured && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Please configure your Minimax credentials in the{' '}
              <strong>Secrets</strong> section to enable TTS.
            </p>
          </div>
        )}
      </div>

      {/* TTS Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">TTS Settings</h3>

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Enable TTS</label>
          <button
            onClick={() => handleUpdate('enabled', !tts?.enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              tts?.enabled ? 'bg-pink-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                tts?.enabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Voice</label>
          <select
            value={tts?.voice || 'female-tianmei'}
            onChange={(e) => handleUpdate('voice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
          >
            {VOICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Speed Slider */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Speed: {tts?.speed?.toFixed(1) || '1.0'}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={tts?.speed || 1.0}
            onChange={(e) => handleUpdate('speed', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Auto Play Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Auto Play Responses</label>
          <button
            onClick={() => handleUpdate('autoPlay', !tts?.autoPlay)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              tts?.autoPlay ? 'bg-pink-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                tts?.autoPlay ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Cache Size */}
        <div>
          <label className="block text-sm font-medium mb-2">Cache Size (MB)</label>
          <input
            type="number"
            min="10"
            max="1000"
            value={tts?.cacheMB || 100}
            onChange={(e) => handleUpdate('cacheMB', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}
