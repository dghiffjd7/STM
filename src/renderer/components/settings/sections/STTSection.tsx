import { useState } from 'react';

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
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const handleTestMicrophone = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Test microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the stream immediately
      stream.getTracks().forEach((track) => track.stop());

      // Test speech recognition
      if (isSupported) {
        const recognition = new SpeechRecognition();
        recognition.lang = stt?.language || 'zh-CN';

        recognition.onstart = () => {
          setTestResult({
            success: true,
            message: '✓ Microphone and speech recognition working! Say something to test...',
          });
          setTimeout(() => {
            recognition.stop();
          }, 3000);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTestResult({
            success: true,
            message: `✓ Test successful! Heard: "${transcript}"`,
          });
          toast.success('Microphone test passed');
        };

        recognition.onerror = (event: any) => {
          let errorMsg = 'Test failed';
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            errorMsg = '❌ Microphone permission denied';
          } else if (event.error === 'no-speech') {
            errorMsg = '⚠️ No speech detected. Microphone is working but didn\'t hear anything.';
          } else {
            errorMsg = `❌ Error: ${event.error}`;
          }
          setTestResult({ success: false, message: errorMsg });
        };

        recognition.onend = () => {
          setIsTesting(false);
        };

        recognition.start();
      } else {
        setTestResult({
          success: true,
          message: '✓ Microphone access granted (but Speech Recognition not supported)',
        });
        setIsTesting(false);
      }
    } catch (err: any) {
      console.error('Microphone test failed:', err);

      let errorMsg = '❌ Microphone test failed';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = '❌ Microphone permission denied. Please allow access in your browser.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = '❌ No microphone found. Please connect a microphone.';
      } else {
        errorMsg = `❌ Error: ${err.message}`;
      }

      setTestResult({ success: false, message: errorMsg });
      setIsTesting(false);
      toast.error('Microphone test failed');
    }
  };

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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Speech-to-Text Settings</h3>
          <button
            onClick={handleTestMicrophone}
            disabled={isTesting || !isSupported}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTesting ? 'Testing...' : '🎤 Test Microphone'}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-3 rounded-lg text-sm ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {testResult.message}
          </div>
        )}

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
              Automatically send message after speech ends
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
