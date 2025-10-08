import type { Profile } from './types';

// 在 Electron 环境中，process 在 main/preload 中直接可用
// 在 renderer 中通过 nodeIntegration 或 contextBridge 间接可用
// 这里直接使用 process.env，由构建工具和 Electron 环境保证可用性
export const MODE = process.env.NODE_ENV || 'production';
export const IS_DEV = MODE !== 'production';

// 安全获取环境变量的辅助函数
function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export const IPC_CHANNELS = {
  // AI
  AI_STREAM: 'ipc://ai.stream',
  AI_CANCEL: 'ipc://ai.cancel',

  // TTS
  TTS_SPEAK: 'ipc://tts.speak',
  TTS_CANCEL: 'ipc://tts.cancel',

  // STT
  STT_START: 'ipc://stt.start',
  STT_STOP: 'ipc://stt.stop',
  STT_RESULT: 'ipc://stt.result',

  // File system
  FS_EXEC: 'ipc://fs.exec',

  // System
  SYS_TOGGLE: 'ipc://sys.toggle',
  SYS_MINIMIZE: 'ipc://sys.minimize',
  SYS_CLOSE: 'ipc://sys.close',
  SYS_OPEN_SETTINGS: 'ipc://sys.openSettings',
  SYS_SET_IGNORE_MOUSE: 'ipc://sys.setIgnoreMouse',
  SYS_UPDATE_APPEARANCE: 'ipc://sys.updateAppearance',

  // Permission
  PERMISSION_REQUEST: 'ipc://permission.request',
  PERMISSION_CHECK: 'ipc://permission.check',

  // Config
  CONFIG_GET: 'ipc://config.get',
  CONFIG_SET: 'ipc://config.set',

  // Session
  SESSION_SAVE: 'ipc://session.save',
  SESSION_LOAD: 'ipc://session.load',
  SESSION_LIST: 'ipc://session.list',
} as const;

export const DEFAULT_CONFIG = {
  version: 1,
  ai: {
    provider: 'openai_compat' as const,
    model: getEnv('STM_OPENAI_MODEL', 'gpt-4o-mini'),
    temperature: parseFloat(getEnv('STM_OPENAI_TEMPERATURE', '0.7')),
    top_p: 1.0,
    max_tokens: parseInt(getEnv('STM_OPENAI_MAX_TOKENS', '2048'), 10),
    timeoutMs: parseInt(getEnv('STM_OPENAI_TIMEOUT_MS', '30000'), 10),
    systemPrompt: 'You are STM, a helpful desktop maid assistant. Be concise and actionable.',
    openaiCompat: {
      baseUrl: getEnv('STM_OPENAI_BASE_URL', 'https://api.openai.com'),
    },
    gemini: {
      useVertex: false,
      projectId: getEnv('STM_GEMINI_PROJECT_ID', ''),
      location: getEnv('STM_GEMINI_LOCATION', 'us-central1'),
      serviceAccountJsonPath: getEnv('STM_GEMINI_SA_JSON_PATH', ''),
    },
  },
  tts: {
    enabled: true,
    voice: 'female-tianmei',
    speed: 1.0,
    autoPlay: true,
    cacheMB: 100,
  },
  stt: {
    enabled: false,
    provider: 'browser' as const,
    language: 'zh-CN',
    continuous: false,
    vadEnabled: true,
    vadThreshold: 0.5,
    autoSubmit: true,
    silenceTimeout: 1500,
  },
  characters: {
    currentCharacterId: 'default',
    characters: [
      {
        id: 'default',
        name: 'Default Maid',
        path: '',
        enabled: true,
      },
    ],
  },
  permissions: {
    allowPaths: [] as string[],
    denyPaths: [] as string[],
    confirmDestructive: true as const,
    auditDir: '',  // Will be set on first run to app.getPath('userData')/logs
    retentionDays: 30,
  },
  shortcuts: {
    summon: 'Alt+Space',
    speak: 'Alt+S',
    settings: 'Alt+,',
  },
  appearance: {
    theme: 'system' as const,
    size: 'md' as const,
    opacity: 0.95,
    alwaysOnTop: true,
  },
  profiles: [] as Profile[],
};

export const MAID_STATES = {
  IDLE: 'idle',
  HOVER: 'hover',
  DRAG: 'drag',
  SPEAK: 'speak',
  THINK: 'think',
  ERROR: 'error',
  SLEEP: 'sleep',
} as const;
