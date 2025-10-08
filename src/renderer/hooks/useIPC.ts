import { useCallback } from 'react';
import type { LLMRequest, TTSRequest, Command, PermissionRequest } from '../../shared/types';

export function useIPC() {
  const streamAI = useCallback(
    (request: LLMRequest, onChunk: (content: string, done: boolean) => void) => {
      window.electronAPI.aiStream(request, (chunk) => {
        onChunk(chunk.content, chunk.done);
      });
    },
    []
  );
 
  const cancelAI = useCallback(() => {
    window.electronAPI.aiCancel();
  }, []);

  const speak = useCallback(async (request: TTSRequest) => {
    return await window.electronAPI.ttsSpeak(request);
  }, []);

  const cancelTTS = useCallback(() => {
    window.electronAPI.ttsCancel();
  }, []);

  const executeCommand = useCallback(async (command: Command) => {
    return await window.electronAPI.fsExec(command);
  }, []);

  const requestPermission = useCallback(async (request: PermissionRequest) => {
    return await window.electronAPI.permissionRequest(request);
  }, []);

  const checkPermission = useCallback(async (domain: string, scope?: string) => {
    return await window.electronAPI.permissionCheck(domain as any, scope);
  }, []);

  const minimize = useCallback(() => {
    window.electronAPI.sysMinimize();
  }, []);

  const close = useCallback(() => {
    window.electronAPI.sysClose();
  }, []);

  return {
    streamAI,
    cancelAI,
    speak,
    cancelTTS,
    executeCommand,
    requestPermission,
    checkPermission,
    minimize,
    close,
  };
}
