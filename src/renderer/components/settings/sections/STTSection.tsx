interface STTSectionProps {
  config: any;
  toast: any;
}

const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: 'Chinese (Mandarin)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
];

export function STTSection({ config, toast }: STTSectionProps) {
  const stt = config.config?.stt;

  const handleUpdate = async (field: string, value: any) => {
    const result = await config.update({
      stt: {
        ...stt,
        [field]: value,
      },
    });

    if (result.success) {
      toast.success('STT settings updated');
    } else {
      toast.error(result.error || 'Failed to update settings');
    }
  };

  // Check if browser supports Web Speech API
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const isSupported = Boolean(SpeechRecognition);

  return (
    <div className="space-y-6">
      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ Speech Recognition Not Supported
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Your browser doesn't support Web Speech API. Please use Chrome, Edge, or Safari for
            voice input functionality.
          </p>
        </div>
      )}

      {/* STT Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Speech-to-Text Settings</h3>

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Enable STT</label>
            <p className="text-xs text-gray-500 mt-1">
              Allow voice input via microphone button
            </p>
          </div>
          <button
            onClick={() => handleUpdate('enabled', !stt?.enabled)}
            disabled={!isSupported}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              stt?.enabled ? 'bg-pink-500' : 'bg-gray-300'
            } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                stt?.enabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Recognition Language</label>
          <select
            value={stt?.language || 'zh-CN'}
            onChange={(e) => handleUpdate('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Continuous Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Continuous Mode</label>
            <p className="text-xs text-gray-500 mt-1">
              Keep listening after recognizing speech
            </p>
          </div>
          <button
            onClick={() => handleUpdate('continuous', !stt?.continuous)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              stt?.continuous ? 'bg-pink-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                stt?.continuous ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Auto Submit Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Auto Submit</label>
            <p className="text-xs text-gray-500 mt-1">
              Automatically fill input after silence
            </p>
          </div>
          <button
            onClick={() => handleUpdate('autoSubmit', !stt?.autoSubmit)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              stt?.autoSubmit ? 'bg-pink-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                stt?.autoSubmit ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Silence Timeout */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Silence Timeout: {(stt?.silenceTimeout || 1500) / 1000}s
          </label>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={stt?.silenceTimeout || 1500}
            onChange={(e) => handleUpdate('silenceTimeout', parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            How long to wait after speech before auto-stopping
          </p>
        </div>
      </div>
    </div>
  );
}
