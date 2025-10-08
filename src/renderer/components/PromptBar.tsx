import { useState, useCallback, useEffect, useRef } from 'react';
import { useChatStore } from '../store';
import { useAIStream } from '../hooks/useAIStream';
import { useMaidState } from '../hooks/useMaidState';
import { useTTS } from '../hooks/useTTS';
import { useSTT } from '../hooks/useSTT';
import { useConfigStore } from '../store';

export function PromptBar() {
  const [input, setInput] = useState('');
  const { addMessage } = useChatStore();
  const { setState } = useMaidState();
  const { speak } = useTTS();
  const stt = useSTT();
  const config = useConfigStore((state) => state.config);
  const wasListeningRef = useRef(false);

  const { text, streaming, error, start, cancel } = useAIStream({
    onComplete: (fullText) => {
      // Add final assistant message to chat
      addMessage({ role: 'assistant', content: fullText });
      setState('idle');
      // Speak the response
      speak(fullText);
    },
    onError: (err) => {
      console.error('AI stream error:', err);
      setState('error');
      // Optionally add error message to chat
      addMessage({ role: 'assistant', content: `❌ Error: ${err}` });
    },
  });

  // Unified submit function for both manual and voice input
  const submitMessage = useCallback(
    (content: string) => {
      if (!content.trim() || streaming) return;

      // Add user message to chat
      addMessage({ role: 'user', content: content.trim() });
      setInput('');

      // Start AI stream
      setState('think');

      start({
        system: 'You are STM, a helpful desktop maid assistant. Be concise and actionable.',
        messages: [{ role: 'user', content: content.trim() }],
      });
    },
    [streaming, addMessage, setState, start]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitMessage(input);
    },
    [input, submitMessage]
  );

  const handleCancel = useCallback(() => {
    cancel();
    setState('idle');
  }, [cancel, setState]);

  // Update maid state based on streaming text
  useEffect(() => {
    if (streaming && text) {
      setState('speak');
    }
  }, [streaming, text, setState]);

  // Sync STT transcript to input while listening
  useEffect(() => {
    if (stt.isListening) {
      setInput(stt.fullTranscript);
    }
  }, [stt.fullTranscript, stt.isListening]);

  // Auto-submit when STT stops (if configured)
  useEffect(() => {
    const wasListening = wasListeningRef.current;
    const stoppedListening = wasListening && !stt.isListening;

    if (stoppedListening && stt.transcript && stt.transcript.trim()) {
      const transcriptText = stt.transcript.trim();
      stt.clear();

      // Auto-submit if enabled in config
      if (config?.stt?.autoSubmit) {
        // Use unified submit function
        setTimeout(() => {
          submitMessage(transcriptText);
        }, 100);
      } else {
        // Just fill the input for manual submission
        setInput(transcriptText);
      }
    }

    // Update ref at the end of the effect
    wasListeningRef.current = stt.isListening;
  }, [stt.isListening, stt.transcript, config, stt, submitMessage]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[500px]">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          placeholder={streaming ? 'AI is responding...' : 'Type a message...'}
          className="w-full px-4 py-3 pr-24 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          {/* Microphone button (STT) */}
          {stt.isSupported && stt.isEnabled && !streaming && (
            <button
              type="button"
              onClick={stt.isListening ? stt.stop : stt.start}
              className={`p-2 rounded-lg transition-all ${
                stt.isListening
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={stt.isListening ? 'Stop listening' : 'Start voice input'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>
          )}

          {streaming ? (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          )}
        </div>
      </form>

      {/* Show streaming text preview */}
      {streaming && text && (
        <div className="mt-2 px-4 py-2 rounded-xl bg-gray-100/90 backdrop-blur-sm text-sm text-gray-700 max-h-20 overflow-y-auto">
          {text}
        </div>
      )}

      {/* Show error if any */}
      {error && !streaming && (
        <div className="mt-2 px-4 py-2 rounded-xl bg-red-100/90 backdrop-blur-sm text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Show STT error if any */}
      {stt.error && (
        <div className="mt-2 px-4 py-2 rounded-xl bg-red-100/90 backdrop-blur-sm text-sm text-red-700">
          <div className="flex items-start gap-2">
            <span className="font-semibold">🎤</span>
            <div>
              <div className="font-medium">
                {stt.error.type === 'permission-denied' && '❌ Permission Denied'}
                {stt.error.type === 'no-microphone' && '🔇 No Microphone'}
                {stt.error.type === 'not-supported' && '⚠️ Not Supported'}
                {stt.error.type === 'network-error' && '📡 Network Error'}
                {stt.error.type === 'not-enabled' && '🔕 Disabled'}
                {(stt.error.type === 'recognition-error' || stt.error.type === 'aborted' || stt.error.type === 'not-initialized') && '⚠️ Error'}
              </div>
              <div className="text-xs mt-0.5">{stt.error.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Show interim STT transcript */}
      {stt.isListening && stt.interimTranscript && (
        <div className="mt-2 px-4 py-2 rounded-xl bg-blue-100/90 backdrop-blur-sm text-sm text-blue-700 italic">
          Listening: {stt.interimTranscript}
        </div>
      )}
    </div>
  );
}
