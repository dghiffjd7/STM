import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { TTSRequest, TTSResult } from '../../shared/types';
import crypto from 'crypto';
import path from 'path';
import { app } from 'electron';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { getSecret } from '../core/secrets';

// Active TTS request tracking for cancellation
let activeRequest: AbortController | null = null;

interface MinimaxTTSRequest {
  text: string;
  model: string;
  voice_setting: {
    voice_id: string;
    speed: number;
    pitch?: number;
    emotion?: string;
  };
  language_boost?: string;
}

interface MinimaxTTSResponse {
  data: {
    audio: string; // hex-encoded
  };
  trace_id?: string;
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

async function callMinimaxTTS(request: TTSRequest): Promise<Buffer> {
  // Get API credentials from secrets
  const apiKey = await getSecret('minimax', 'apiKey');
  const groupId = await getSecret('minimax', 'groupId');

  if (!apiKey) {
    throw new Error('Minimax API key not configured. Please set it in Settings > Secrets.');
  }

  if (!groupId) {
    throw new Error('Minimax Group ID not configured. Please set it in Settings > Secrets.');
  }

  // Create abort controller for cancellation
  activeRequest = new AbortController();

  const apiUrl = `https://api.minimaxi.chat/v1/t2a_v2?GroupId=${groupId}`;

  const body: MinimaxTTSRequest = {
    text: request.text,
    model: 'speech-02-hd',
    voice_setting: {
      voice_id: request.voice || 'female-tianmei',
      speed: request.speed || 1.0,
      pitch: 0,
      emotion: 'neutral',
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: activeRequest.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Minimax API error (${response.status}): ${errorText}`);
    }

    const result = (await response.json()) as MinimaxTTSResponse;

    // Check for API-level errors
    if (result.base_resp && result.base_resp.status_code !== 0) {
      throw new Error(`Minimax API error: ${result.base_resp.status_msg}`);
    }

    if (!result.data || !result.data.audio) {
      throw new Error('Invalid response from Minimax API: missing audio data');
    }

    // Convert hex-encoded audio to buffer
    const audioBuffer = Buffer.from(result.data.audio, 'hex');
    return audioBuffer;
  } finally {
    activeRequest = null;
  }
}

async function ensureCacheDir(cacheDir: string): Promise<void> {
  if (!existsSync(cacheDir)) {
    await fs.mkdir(cacheDir, { recursive: true });
  }
}

async function getCachedAudio(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getAudioDuration(filePath: string): Promise<number> {
  // Simple estimation: assume 128kbps MP3
  // More accurate would require audio library
  try {
    const stats = await fs.stat(filePath);
    const fileSizeKB = stats.size / 1024;
    const durationSeconds = (fileSizeKB * 8) / 128; // 128 kbps
    return Math.round(durationSeconds * 1000);
  } catch {
    return 1000; // fallback
  }
}

export function registerTtsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.TTS_SPEAK, async (event, request: TTSRequest): Promise<TTSResult> => {
    try {
      // Generate cache key
      const hash = crypto
        .createHash('md5')
        .update(`${request.text}-${request.voice}-${request.speed || 1.0}`)
        .digest('hex');

      const cacheKey = hash;
      const cacheDir = path.join(app.getPath('userData'), 'tts-cache');
      const filePath = path.join(cacheDir, `${cacheKey}.mp3`);

      // Ensure cache directory exists
      await ensureCacheDir(cacheDir);

      // Check cache first
      const cached = await getCachedAudio(filePath);

      if (cached) {
        console.log('[TTS] Using cached audio:', cacheKey);
        const durationMs = await getAudioDuration(filePath);
        return {
          cacheKey,
          filePath,
          durationMs,
        };
      }

      // Call Minimax TTS API
      console.log('[TTS] Generating new audio:', request.text.substring(0, 50) + '...');
      const audioBuffer = await callMinimaxTTS(request);

      // Save to cache
      await fs.writeFile(filePath, audioBuffer);
      console.log('[TTS] Audio saved to cache:', filePath);

      const durationMs = await getAudioDuration(filePath);

      return {
        cacheKey,
        filePath,
        durationMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[TTS] Error:', errorMessage);
      throw new Error(`TTS failed: ${errorMessage}`);
    }
  });

  ipcMain.on(IPC_CHANNELS.TTS_CANCEL, () => {
    if (activeRequest) {
      console.log('[TTS] Cancelling active request');
      activeRequest.abort();
      activeRequest = null;
    }
  });
}
