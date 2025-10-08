import type { ProviderAdapter, StreamSender } from './types';
import type { LLMMessage } from '../../../shared/types';

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

function normalizeMessages(messages: LLMMessage[], system?: string): LLMMessage[] {
  if (system) {
    const rest = messages.filter((m) => m.role !== 'system');
    return [{ role: 'system', content: system }, ...rest];
  }
  return messages;
}

export const openaiCompatAdapter: ProviderAdapter = {
  async streamChat(input, send: StreamSender, abortSignal: AbortSignal, config) {
    const baseUrl = config.openaiCompat?.baseUrl;
    const apiKey = config.apiKey;

    if (!baseUrl || !apiKey) {
      send({ type: 'error', message: 'OpenAI-compatible API not configured', code: 'config_error' });
      return;
    }

    const url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;

    const body = {
      model: input.model,
      stream: true,
      temperature: input.temperature ?? config.temperature ?? 0.7,
      top_p: input.top_p ?? 1,
      max_tokens: input.max_tokens ?? config.max_tokens,
      messages: normalizeMessages(input.messages, input.system),
    };
 
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        signal: abortSignal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
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

    let finished = false;

    try {
      for await (const raw of sseLines(response.body)) {
        const line = raw.trim();
        if (!line.startsWith('data:')) continue;

        const data = line.slice(5).trim();

        if (data === '[DONE]') {
          finished = true;
          break;
        }

        try {
          const json = JSON.parse(data);
          const choice = json.choices?.[0];
          const delta = choice?.delta;

          // Handle incremental text
          if (delta?.content) {
            send({ type: 'delta', text: String(delta.content) });
          }

          // Handle usage (some backends send it in the last chunk)
          if (json?.usage && choice?.finish_reason) {
            send({ type: 'done', usage: json.usage });
            finished = true;
          }
        } catch (e: any) {
          // Ignore malformed JSON lines (some providers send non-JSON data)
          console.warn('[openaiCompat] Failed to parse line:', line, e.message);
        }
      }

      if (!finished) {
        send({ type: 'done' });
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
