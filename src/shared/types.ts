// Maid states
export type MaidState = 'idle' | 'hover' | 'drag' | 'speak' | 'think' | 'error' | 'sleep';

// LLM types
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string; // for tool messages
}

export interface LLMStreamChunk {
  id: string;
  content: string;
  done: boolean;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  system?: string;
  stream?: boolean;
}

// AI Provider types
export type Provider = 'openai_compat' | 'anthropic' | 'gemini';

export interface AISection {
  provider: Provider;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens?: number;
  timeoutMs: number;
  systemPrompt?: string;

  // Provider-specific (non-sensitive)
  openaiCompat?: {
    baseUrl: string;
  };
  gemini: {
    useVertex: boolean;
    projectId?: string;
    location?: string;
    serviceAccountJsonPath?: string; // Only path, not content
  };
}

export interface TTSSection {
  enabled: boolean;
  voice: string;
  speed: number;
  autoPlay: boolean;
  cacheMB: number;
}

export interface PermissionsSection {
  allowPaths: string[];
  denyPaths: string[];
  confirmDestructive: true;
  auditDir: string;
  retentionDays: number;
}

export interface ShortcutSection {
  summon: string;
  speak: string;
  settings: string;
}

export interface AppearanceSection {
  theme: 'light' | 'dark' | 'system';
  size: 'sm' | 'md' | 'lg';
  opacity: number;
  alwaysOnTop: boolean;
}

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
  ai?: Partial<AISection>;
  tts?: Partial<TTSSection>;
  appearance?: Partial<AppearanceSection>;
}

export interface STMConfig {
  version: number;
  ai: AISection;
  tts: TTSSection;
  permissions: PermissionsSection;
  shortcuts: ShortcutSection;
  appearance: AppearanceSection;
  profiles: Profile[];
}

export interface SecretStatus {
  provider: Provider | string;
  hasApiKey: boolean;
  hasGeminiApiKey: boolean;
  hasServiceAccount: boolean;
}

export interface SecretSetRequest {
  provider: Provider | string;
  kind: string;
  value: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  message?: string;
  latencyMs?: number;
}

export interface OperationResult {
  success: boolean;
  error?: string;
}

// Legacy AIConfig for backwards compatibility
export interface AIConfig extends AISection {
  apiKey?: string; // Will be moved to secret storage
}

// TTS types
export interface TTSRequest {
  text: string;
  voice: string;
  speed?: number;
}

export interface TTSResult {
  cacheKey: string;
  filePath: string;
  durationMs: number;
}

// Permission types
export type PermissionDomain =
  | 'fs.read'
  | 'fs.write'
  | 'fs.delete'
  | 'sys.clipboard'
  | 'sys.shortcut'
  | 'sys.open';

export interface PermissionRule {
  domain: PermissionDomain;
  allow: boolean;
  scope?: string; // path/wildcard/URL domain
  timestamp?: number;
}

export interface PermissionRequest {
  domain: PermissionDomain;
  action: string;
  scope?: string;
  detail?: string;
}

export interface PermissionResponse {
  granted: boolean;
  remember?: boolean; // "once" | "always" | "never"
}

// Command types
export interface CommandOpen {
  type: 'open';
  target: string;
}

export interface CommandMove {
  type: 'move';
  from: string;
  to: string;
  rename?: string;
}

export interface CommandCopy {
  type: 'copy';
  from: string;
  to: string;
}

export interface CommandDelete {
  type: 'delete';
  target: string;
}

export interface CommandRead {
  type: 'read';
  target: string;
}

export interface CommandWrite {
  type: 'write';
  target: string;
  content: string;
}

export type Command =
  | CommandOpen
  | CommandMove
  | CommandCopy
  | CommandDelete
  | CommandRead
  | CommandWrite;

export interface CommandResult {
  ok: boolean;
  detail?: string;
  data?: any;
}

// Configuration types
export interface AppConfig {
  ai: AIConfig;
  tts: {
    minimaxApiKey?: string;
    voice: string;
    speed: number;
    autoPlay: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    alwaysOnTop: boolean;
    clickThrough: boolean;
  };
  shortcuts: {
    toggle: string;
  };
}

// Chat session types
export interface ChatSession {
  id: string;
  title: string;
  messages: LLMMessage[];
  createdAt: number;
  updatedAt: number;
}

// Audit log types
export interface AuditLogEntry {
  timestamp: number;
  domain: PermissionDomain;
  action: string;
  params: any;
  result: 'success' | 'failure';
  error?: string;
}
