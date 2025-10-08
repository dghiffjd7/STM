import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import type {
  LLMRequest,
  TTSRequest,
  TTSResult,
  Command,
  CommandResult,
  PermissionRequest,
  PermissionResponse,
  PermissionDomain,
  AppConfig,
} from '../shared/types';

// Expose safe API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // TTS
  ttsSpeak: (request: TTSRequest): Promise<TTSResult> => {
    return ipcRenderer.invoke(IPC_CHANNELS.TTS_SPEAK, request);
  },
  ttsCancel: () => {
    ipcRenderer.send(IPC_CHANNELS.TTS_CANCEL);
  },

  // File system
  fsExec: (command: Command): Promise<CommandResult> => {
    return ipcRenderer.invoke(IPC_CHANNELS.FS_EXEC, command);
  },

  // System
  sysToggle: () => {
    ipcRenderer.send(IPC_CHANNELS.SYS_TOGGLE);
  },
  sysMinimize: () => {
    ipcRenderer.send(IPC_CHANNELS.SYS_MINIMIZE);
  },
  sysClose: () => {
    ipcRenderer.send(IPC_CHANNELS.SYS_CLOSE);
  },
  sysOpenSettings: () => {
    ipcRenderer.send(IPC_CHANNELS.SYS_OPEN_SETTINGS);
  },
  sysSetIgnoreMouse: (ignore: boolean) => {
    ipcRenderer.send(IPC_CHANNELS.SYS_SET_IGNORE_MOUSE, ignore);
  },

  // Permission
  permissionRequest: (request: PermissionRequest): Promise<PermissionResponse> => {
    return ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_REQUEST, request);
  },
  permissionCheck: (domain: PermissionDomain, scope?: string): Promise<boolean> => {
    return ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_CHECK, domain, scope);
  },

  // Legacy config (deprecated)
  configGet: (): Promise<AppConfig> => {
    return ipcRenderer.invoke('config.get');
  },
  configSet: (config: Partial<AppConfig>): Promise<void> => {
    return ipcRenderer.invoke('config.set', config);
  },
});

// Expose config/secret management API
contextBridge.exposeInMainWorld('config', {
  get: () => ipcRenderer.invoke('config.get'),
  set: (patch: any) => ipcRenderer.invoke('config.set', patch),
  testConnection: () => ipcRenderer.invoke('config.testConnection'),
  export: () => ipcRenderer.invoke('config.export'),
  import: (json: string) => ipcRenderer.invoke('config.import', json),
  saveProfile: (profile: any) => ipcRenderer.invoke('config.saveProfile', profile),
  deleteProfile: (id: string) => ipcRenderer.invoke('config.deleteProfile', id),
  applyProfile: (id: string) => ipcRenderer.invoke('config.applyProfile', id),
});

contextBridge.exposeInMainWorld('secret', {
  set: (request: any) => ipcRenderer.invoke('secret.set', request),
  status: (provider: string) => ipcRenderer.invoke('secret.status', provider),
});

// Expose AI API separately with event-based streaming
contextBridge.exposeInMainWorld('ai', {
  stream: (payload: LLMRequest): Promise<{ id: string; error?: string }> => {
    return ipcRenderer.invoke('ai.stream', payload);
  },
  onChunk: (id: string, handler: (data: any) => void): (() => void) => {
    const channel = `ai.stream.${id}`;
    const listener = (_evt: any, data: any) => handler(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  cancel: (id: string): Promise<{ ok: boolean; reason?: string }> => {
    return ipcRenderer.invoke('ai.cancel', { id });
  },
});

// Type definitions for renderer process
export type ElectronAPI = {
  ttsSpeak: (request: TTSRequest) => Promise<TTSResult>;
  ttsCancel: () => void;
  fsExec: (command: Command) => Promise<CommandResult>;
  sysToggle: () => void;
  sysMinimize: () => void;
  sysClose: () => void;
  sysOpenSettings: () => void;
  sysSetIgnoreMouse: (ignore: boolean) => void;
  permissionRequest: (request: PermissionRequest) => Promise<PermissionResponse>;
  permissionCheck: (domain: PermissionDomain, scope?: string) => Promise<boolean>;
  configGet: () => Promise<AppConfig>;
  configSet: (config: Partial<AppConfig>) => Promise<void>;
};

export type AIAPI = {
  stream: (payload: LLMRequest) => Promise<{ id: string; error?: string }>;
  onChunk: (id: string, handler: (data: any) => void) => () => void;
  cancel: (id: string) => Promise<{ ok: boolean; reason?: string }>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    ai: AIAPI;
  }
}
