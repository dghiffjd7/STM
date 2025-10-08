import type { ProviderAdapter } from './types';
import { openaiCompatAdapter } from './openaiCompat';
import { anthropicAdapter } from './anthropic';
import { geminiAdapter } from './gemini';

export const providers: Record<string, ProviderAdapter> = {
  openai_compat: openaiCompatAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
};

export * from './types';
