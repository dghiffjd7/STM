import type { LLMMessage, AIConfig } from '../../../shared/types';

export type StreamSender = (
  chunk:
    | { type: 'delta'; text: string }
    | { type: 'done'; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }
    | { type: 'error'; message: string; code?: string }
) => void;

export interface ProviderAdapter {
  streamChat(
    input: {
      messages: LLMMessage[];
      model: string;
      temperature?: number;
      top_p?: number;
      max_tokens?: number;
      system?: string;
      timeoutMs?: number;
    },
    send: StreamSender,
    abortSignal: AbortSignal,
    config: AIConfig  // Full config with secrets injected
  ): Promise<void>;
}
