import { useState, useCallback, useRef, useEffect } from 'react';
import { useConfigStore } from '../store';

// Check if browser supports Web Speech API
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export type STTErrorType =
  | 'not-supported'
  | 'not-enabled'
  | 'permission-denied'
  | 'no-microphone'
  | 'network-error'
  | 'recognition-error'
  | 'aborted'
  | 'not-initialized';

export interface STTError {
  type: STTErrorType;
  message: string;
}

export function useSTT() {
  const config = useConfigStore((state) => state.config);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<STTError | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppingRef = useRef(false);

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

      let errorType: STTErrorType;
      let errorMessage: string;

      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorType = 'permission-denied';
          errorMessage = 'Microphone permission denied. Please allow microphone access in your browser.';
          break;
        case 'no-speech':
          // Silent error, just stop
          return;
        case 'audio-capture':
          errorType = 'no-microphone';
          errorMessage = 'No microphone detected. Please connect a microphone.';
          break;
        case 'network':
          errorType = 'network-error';
          errorMessage = 'Network error. Speech recognition requires internet connection.';
          break;
        case 'aborted':
          errorType = 'aborted';
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorType = 'recognition-error';
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setError({ type: errorType, message: errorMessage });
      setIsListening(false);
      isStoppingRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      isStoppingRef.current = false;
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
      setError({
        type: 'not-supported',
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
      });
      return;
    }

    if (!isEnabled) {
      setError({
        type: 'not-enabled',
        message: 'STT is disabled in settings. Enable it in Settings > STT.',
      });
      return;
    }

    if (!recognitionRef.current) {
      setError({
        type: 'not-initialized',
        message: 'Speech recognition not initialized. Please refresh the page.',
      });
      return;
    }

    // Prevent starting if already stopping
    if (isStoppingRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Clear previous transcript
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      isStoppingRef.current = false;

      // Start recognition
      recognitionRef.current.start();
    } catch (err: any) {
      console.error('[STT] Failed to start:', err);

      let errorType: STTErrorType = 'recognition-error';
      let errorMessage = 'Failed to access microphone';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorType = 'permission-denied';
        errorMessage = 'Microphone permission denied. Please allow access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorType = 'no-microphone';
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      }

      setError({ type: errorType, message: errorMessage });
    }
  }, [isSupported, isEnabled]);

  const stop = useCallback(() => {
    if (recognitionRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
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
