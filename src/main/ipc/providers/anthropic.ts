import type { ProviderAdapter, StreamSender } from './types';
import type { LLMMessage } from '../../../shared/types';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: Array<{ type: 'text'; text: string }>;
}

function convertMessages(messages: LLMMessage[], system?: string): {
  system?: string;
  messages: AnthropicMessage[];
} {
  const systemMessage = system || messages.find((m) => m.role === 'system')?.content;
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  return {
    system: systemMessage,
    messages: nonSystemMessages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: [{ type: 'text', text: m.content }],
    })),
  };
}

async function* sseLines(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += new TextDecoder().decode(value, { stream: true });
    let idx = 0;

    while (true) {
      const nl = buffer.indexOf('\n', idx);
      if (nl === -1) break;
      const line = buffer.slice(idx, nl);
      idx = nl + 1;
      yield line;
    }

    buffer = buffer.slice(idx);
  }

  if (buffer.length) yield buffer;
}

export const anthropicAdapter: ProviderAdapter = {
  async streamChat(input, send: StreamSender, abortSignal: AbortSignal, config) {
    if (!config.apiKey) {
      send({ type: 'error', message: 'Anthropic API key not configured', code: 'config_error' });
      return;
    }

    const url = 'https://api.anthropic.com/v1/messages';
    const { system, messages } = convertMessages(input.messages, input.system);

    const body = {
      model: input.model,
      stream: true,
      max_tokens: input.max_tokens ?? config.max_tokens ?? 2048,
      temperature: input.temperature ?? config.temperature ?? 0.7,
      system,
      messages,
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        signal: abortSignal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        send({ type: 'error', message: 'Request cancelled', code: 'cancelled' });
      } else {
        send({ type: 'error', message: `Network error: ${err.message}`, code: 'network_error' });
      }
      return;
    }

    if (!response.ok || !response.body) {
      let detail = '';
      try {
        detail = await response.text();
      } catch {}
      send({
        type: 'error',
        message: `HTTP ${response.status} ${response.statusText} ${detail}`.trim(),
        code: 'http_error',
      });
      return;
    }
 
    try {
      for await (const raw of sseLines(response.body)) {
        const line = raw.trim();
        if (!line.startsWith('data:')) continue;

        const data = line.slice(5).trim();

        try {
          const json = JSON.parse(data);

          // Handle different event types
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
            send({ type: 'delta', text: json.delta.text });
          } else if (json.type === 'message_delta' && json.usage) {
            // Anthropic sends usage in message_delta
            const usage = {
              prompt_tokens: json.usage.input_tokens || 0,
              completion_tokens: json.usage.output_tokens || 0,
              total_tokens: (json.usage.input_tokens || 0) + (json.usage.output_tokens || 0),
            };
            send({ type: 'done', usage });
          } else if (json.type === 'message_stop') {
            send({ type: 'done' });
          }
        } catch (e: any) {
          console.warn('[anthropic] Failed to parse line:', line, e.message);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        send({ type: 'error', message: 'Request cancelled', code: 'cancelled' });
      } else {
        send({ type: 'error', message: `Stream error: ${err.message}`, code: 'stream_error' });
      }
    }
  },
};
