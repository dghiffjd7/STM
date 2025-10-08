import { useState, useCallback, useRef, useEffect } from 'react';
import { useConfigStore } from '../store';

// Check if browser supports Web Speech API
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSTT() {
  const config = useConfigStore((state) => state.config);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported = Boolean(SpeechRecognition);
  const isEnabled = config?.stt?.enabled ?? false;

  // Initialize recognition
  useEffect(() => {
    if (!isSupported || !isEnabled) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = config.stt.continuous ?? false;
    recognition.interimResults = true;
    recognition.lang = config.stt.language || 'zh-CN';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptSegment + ' ';
        } else {
          interim += transcriptSegment;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
        setInterimTranscript('');

        // Reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto-stop after silence
        if (config.stt.autoSubmit) {
          silenceTimerRef.current = setTimeout(() => {
            stop();
          }, config.stt.silenceTimeout || 1500);
        }
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[STT] Recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isSupported, isEnabled, config]);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    if (!isEnabled) {
      setError('STT is disabled in settings');
      return;
    }

    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Clear previous transcript
      setTranscript('');
      setInterimTranscript('');
      setError(null);

      // Start recognition
      recognitionRef.current.start();
    } catch (err: any) {
      console.error('[STT] Failed to start:', err);
      setError(err.message || 'Failed to access microphone');
    }
  }, [isSupported, isEnabled]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isEnabled,
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: transcript + interimTranscript,
    error,
    start,
    stop,
    clear,
  };
}
