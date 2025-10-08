import Store from 'electron-store';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import type { Provider, SecretStatus } from '../../shared/types';

const ALGORITHM = 'aes-256-gcm';
const SERVICE_NAME = 'stm-desktop';

// Encryption key derived from machine-specific data
let encryptionKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (!encryptionKey) {
    // Generate a machine-specific key (simplified version - in production use machine ID)
    const machineKey = process.env.STM_MACHINE_KEY || 'stm-default-key-change-in-production';
    encryptionKey = Buffer.from(machineKey.padEnd(32, '0').slice(0, 32));
  }
  return encryptionKey;
}

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted data format');

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Fallback encrypted store
const secretStore = new Store<Record<string, string>>({
  name: 'secrets',
  encryptionKey: getEncryptionKey().toString('hex'),
});

// Try keytar, fallback to encrypted store
let keytar: any = null;
let useKeytar = false;

(async () => {
  try {
    keytar = await import('keytar');
    useKeytar = true;
    console.log('[secrets] Using system keychain (keytar)');
  } catch (err) {
    console.log('[secrets] Keytar unavailable, using encrypted store fallback');
  }
})();

async function setSecretInternal(account: string, password: string): Promise<void> {
  if (useKeytar && keytar) {
    await keytar.setPassword(SERVICE_NAME, account, password);
  } else {
    secretStore.set(account, encrypt(password));
  }
}

async function getSecretInternal(account: string): Promise<string | null> {
  if (useKeytar && keytar) {
    return await keytar.getPassword(SERVICE_NAME, account);
  } else {
    const encrypted = secretStore.get(account);
    if (!encrypted) return null;
    try {
      return decrypt(encrypted);
    } catch (err) {
      console.error('[secrets] Decryption failed:', err);
      return null;
    }
  }
}

async function deleteSecretInternal(account: string): Promise<void> {
  if (useKeytar && keytar) {
    await keytar.deletePassword(SERVICE_NAME, account);
  } else {
    secretStore.delete(account);
  }
}

// Public API
export async function setSecret(provider: Provider | string, kind: string, value: string): Promise<void> {
  const account = `${provider}:${kind}`;
  await setSecretInternal(account, value);
}

export async function getSecret(provider: Provider | string, kind: string): Promise<string | null> {
  const account = `${provider}:${kind}`;
  return await getSecretInternal(account);
}

export async function deleteSecret(provider: Provider | string, kind: string): Promise<void> {
  const account = `${provider}:${kind}`;
  await deleteSecretInternal(account);
}

export async function getSecretStatus(provider: Provider | string): Promise<SecretStatus> {
  const [apiKey, geminiApiKey, serviceAccount] = await Promise.all([
    getSecret(provider, 'apiKey'),
    getSecret(provider, 'geminiApiKey'),
    getSecret(provider, 'serviceAccountJsonPath'),
  ]);

  return {
    provider,
    hasApiKey: !!apiKey,
    hasGeminiApiKey: !!geminiApiKey,
    hasServiceAccount: !!serviceAccount,
  };
}
