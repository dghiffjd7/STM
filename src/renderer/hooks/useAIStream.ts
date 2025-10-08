import { useRef, useState, useCallback, useEffect } from 'react';
import type { LLMRequest } from '../../shared/types';

interface UseAIStreamOptions {
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export function useAIStream(options?: UseAIStreamOptions) {
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const unsubRef = useRef<null | (() => void)>(null);
  const idRef = useRef<string | null>(null);

  const start = useCallback(
    async (payload: LLMRequest) => {
      if (streaming) return;

      setText('');
      setError(null);
      setStreaming(true);
 
      try {
        const { id, error: streamError } = await window.ai.stream(payload);

        if (streamError) {
          setError(streamError);
          setStreaming(false);
          options?.onError?.(streamError);
          return;
        }

        idRef.current = id;

        unsubRef.current = window.ai.onChunk(id, (evt) => {
          if (evt.type === 'delta') {
            setText((prev) => prev + evt.text);
          } else if (evt.type === 'error') {
            setError(evt.message);
            setStreaming(false);
            options?.onError?.(evt.message);
          } else if (evt.type === 'done') {
            setStreaming(false);
            // Call onComplete with the final accumulated text
            setText((finalText) => {
              options?.onComplete?.(finalText);
              return finalText;
            });
          }
        });
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to start stream';
        setError(errorMsg);
        setStreaming(false);
        options?.onError?.(errorMsg);
      }
    },
    [streaming, options]
  );

  const cancel = useCallback(async () => {
    if (!idRef.current) return;

    try {
      await window.ai.cancel(idRef.current);
    } catch (err) {
      console.error('Failed to cancel stream:', err);
    }

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    setStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, []);

  return {
    text,
    streaming,
    error,
    start,
    cancel,
  };
}
