import { useEffect } from 'react';
import { useMaidStore } from '../store';
import type { MaidState } from '../../shared/types';

export function useMaidState() {
  const { state, setState } = useMaidStore();

  useEffect(() => {
    // Auto-transition from certain states back to idle
    if (state === 'think') {
      const timer = setTimeout(() => setState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, setState]);
 
  return {
    state,
    setState,
    isIdle: state === 'idle',
    isHover: state === 'hover',
    isDragging: state === 'drag',
    isSpeaking: state === 'speak',
    isThinking: state === 'think',
    hasError: state === 'error',
    isSleeping: state === 'sleep',
  };
}
