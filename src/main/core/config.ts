import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';
import type { STMConfig, AIConfig, Profile, ConnectionTestResult } from '../../shared/types';
import { DEFAULT_CONFIG } from '../../shared/constants';
import { getSecret } from './secrets';

// Initialize store with defaults
const store = new Store<STMConfig>({
  defaults: {
    ...DEFAULT_CONFIG,
    permissions: {
      ...DEFAULT_CONFIG.permissions,
      auditDir: path.join(app.getPath('userData'), 'logs'),
    },
  },
});
 
// Config migration
function migrateConfig(): void {
  const currentVersion = store.get('version', 0);

  if (currentVersion < 1) {
    // Migration from v0 to v1 (if needed)
    console.log('[config] Migrating from v0 to v1');
    // Add migration logic here
    store.set('version', 1);
  }

  // Future migrations go here
}

// Initialize config on app start
export function initConfig(): void {
  migrateConfig();

  // Ensure audit directory exists
  const auditDir = store.get('permissions.auditDir');
  if (!auditDir) {
    store.set('permissions.auditDir', path.join(app.getPath('userData'), 'logs'));
  }
}

// Get full config (without secrets)
export function getConfig(): STMConfig {
  return store.store;
}

// Set config (partial update, non-sensitive only)
export function setConfig(patch: Partial<STMConfig>): void {
  // Merge with existing config
  const current = store.store;
  const updated = {
    ...current,
    ...patch,
    // Deep merge sections
    ai: patch.ai ? { ...current.ai, ...patch.ai } : current.ai,
    tts: patch.tts ? { ...current.tts, ...patch.tts } : current.tts,
    stt: patch.stt ? { ...current.stt, ...patch.stt } : current.stt,
    permissions: patch.permissions ? { ...current.permissions, ...patch.permissions } : current.permissions,
    shortcuts: patch.shortcuts ? { ...current.shortcuts, ...patch.shortcuts } : current.shortcuts,
    appearance: patch.appearance ? { ...current.appearance, ...patch.appearance } : current.appearance,
    profiles: patch.profiles !== undefined ? patch.profiles : current.profiles,
  };

  store.set(updated);
}

// Get AI config with secrets injected (for provider use)
export async function getAIConfigWithSecrets(): Promise<AIConfig> {
  const config = store.get('ai');
  const provider = config.provider;

  // Inject secrets based on provider
  let apiKey: string | undefined;

  if (provider === 'openai_compat' || provider === 'anthropic') {
    apiKey = (await getSecret(provider, 'apiKey')) || undefined;
  } else if (provider === 'gemini') {
    if (config.gemini.useVertex) {
      // Vertex uses service account path (already in config)
    } else {
      apiKey = (await getSecret(provider, 'geminiApiKey')) || undefined;
    }
  }

  return {
    ...config,
    apiKey,
  };
}

// Legacy compatibility
export function getAIConfig(): AIConfig {
  const config = store.get('ai');
  return {
    ...config,
    // Note: apiKey will be undefined here, use getAIConfigWithSecrets() when needed
  };
}

// Save profile
export function saveProfile(profile: Profile): void {
  const profiles = store.get('profiles', []);
  const existingIndex = profiles.findIndex((p) => p.id === profile.id);

  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }

  store.set('profiles', profiles);
}

// Delete profile
export function deleteProfile(id: string): void {
  const profiles = store.get('profiles', []);
  store.set('profiles', profiles.filter((p) => p.id !== id));
}

// Apply profile
export function applyProfile(id: string): void {
  const profiles = store.get('profiles', []);
  const profile = profiles.find((p) => p.id === id);

  if (!profile) {
    throw new Error(`Profile not found: ${id}`);
  }

  const current = store.store;
  const updated: STMConfig = {
    ...current,
    ai: profile.ai ? { ...current.ai, ...profile.ai } : current.ai,
    tts: profile.tts ? { ...current.tts, ...profile.tts } : current.tts,
    stt: profile.stt ? { ...current.stt, ...profile.stt } : current.stt,
    appearance: profile.appearance ? { ...current.appearance, ...profile.appearance } : current.appearance,
  };

  store.set(updated);
}

// Export config (with secrets redacted)
export function exportConfig(): string {
  const config = store.store;

  // Redact any sensitive fields
  const sanitized: any = JSON.parse(JSON.stringify(config));

  // Mark secret fields as redacted
  if (sanitized.ai?.apiKey) sanitized.ai.apiKey = '[REDACTED]';
  if (sanitized.tts?.minimaxApiKey) sanitized.tts.minimaxApiKey = '[REDACTED]';

  // Redact in profiles too
  if (sanitized.profiles) {
    sanitized.profiles = sanitized.profiles.map((p: any) => {
      if (p.ai?.apiKey) p.ai.apiKey = '[REDACTED]';
      if (p.tts?.minimaxApiKey) p.tts.minimaxApiKey = '[REDACTED]';
      return p;
    });
  }

  return JSON.stringify(sanitized, null, 2);
}

// Import config (ignoring secrets)
export function importConfig(jsonString: string): void {
  const imported = JSON.parse(jsonString);

  // Remove any redacted fields
  if (imported.ai) {
    delete imported.ai.apiKey;
  }
  if (imported.tts) {
    delete imported.tts.minimaxApiKey;
  }

  // Clean profiles
  if (imported.profiles) {
    imported.profiles = imported.profiles.map((p: any) => {
      if (p.ai) delete p.ai.apiKey;
      if (p.tts) delete p.tts.minimaxApiKey;
      return p;
    });
  }

  // Merge with current config
  setConfig(imported);
}

// Test connection (uses provider adapters)
export async function testConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    // Import provider to test (avoid circular dependency)
    const { providers } = await import('../ipc/providers');
    const config = await getAIConfigWithSecrets();
    const adapter = providers[config.provider];

    if (!adapter) {
      return { ok: false, message: `Unknown provider: ${config.provider}` };
    }

    // Create minimal test message
    const testMessage = { role: 'user' as const, content: 'test' };
    let receivedChunk = false;
    const abortController = new AbortController();

    await adapter.streamChat(
      {
        messages: [testMessage],
        model: config.model,
        max_tokens: 5,
        timeoutMs: 10000,
      },
      (chunk) => {
        if (chunk.type === 'delta' || chunk.type === 'done') {
          receivedChunk = true;
          abortController.abort(); // Cancel immediately after first response
        }
        if (chunk.type === 'error') {
          throw new Error(chunk.message);
        }
      },
      abortController.signal,
      config  // Pass config with secrets
    );

    const latencyMs = Date.now() - startTime;

    if (receivedChunk) {
      return { ok: true, message: 'Connection successful', latencyMs };
    } else {
      return { ok: false, message: 'No response from provider' };
    }
  } catch (err: any) {
    return {
      ok: false,
      message: err.message || 'Connection failed',
      latencyMs: Date.now() - startTime,
    };
  }
}
