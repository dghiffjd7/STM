import { useState, useCallback } from 'react';
import { useChatStore } from '../store';
import { useAIStream } from '../hooks/useAIStream';
import { useMaidState } from '../hooks/useMaidState';

export function PromptBar() {
  const [input, setInput] = useState('');
  const { addMessage } = useChatStore();
  const { setState } = useMaidState();

  const { text, streaming, error, start, cancel } = useAIStream({
    onComplete: (fullText) => {
      // Add final assistant message to chat
      addMessage({ role: 'assistant', content: fullText });
      setState('idle');
    },
    onError: (err) => {
      console.error('AI stream error:', err);
      setState('error');
      // Optionally add error message to chat
      addMessage({ role: 'assistant', content: `❌ Error: ${err}` });
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || streaming) return;

      // Add user message to chat
      addMessage({ role: 'user', content: input });
      setInput('');

      // Start AI stream
      setState('think');

      start({
        system: 'You are STM, a helpful desktop maid assistant. Be concise and actionable.',
        messages: [{ role: 'user', content: input }],
      });
    },
    [input, streaming, addMessage, setState, start]
  );

  const handleCancel = useCallback(() => {
    cancel();
    setState('idle');
  }, [cancel, setState]);

  // Update maid state based on streaming text
  if (streaming && text) {
    setState('speak');
  }

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
    </div>
  );
}
