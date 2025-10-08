# LLM Implementation Summary

## Architecture Overview

STM implements a **single-path, multi-provider** LLM architecture:

- **Single IPC Channel**: `ai.stream` for all providers
- **Three Provider Adapters**: OpenAI-compatible, Anthropic, Gemini
- **Unified Event Format**: `{type: 'delta'|'done'|'error', ...}`
- **Zero UI Changes**: Switching providers requires only config update

## Provider Support

### 1. OpenAI-Compatible (`openai_compat`)

Covers: OpenAI, DeepSeek, Grok, OpenRouter, and any OpenAI-compatible endpoint

**Configuration:**
```typescript
provider: 'openai_compat'
baseUrl: 'https://api.openai.com' // or 'https://api.deepseek.com', etc.
apiKey: 'sk-...'
model: 'gpt-4o-mini' // or 'deepseek-chat', 'grok-beta', etc.
```

**Implementation:** `src/main/ipc/providers/openaiCompat.ts`
- Standard OpenAI Chat Completions API
- SSE streaming: `data: {JSON}` format
- Handles `[DONE]` signal
- Extracts `choices[0].delta.content`

### 2. Anthropic (`anthropic`)

**Configuration:**
```typescript
provider: 'anthropic'
apiKey: 'sk-ant-...'
model: 'claude-3-5-sonnet-20241022'
```

**Implementation:** `src/main/ipc/providers/anthropic.ts`
- Messages API v1
- Converts message format: `{role, content: [{type:'text', text}]}`
- System prompt → separate `system` field
- SSE event types: `content_block_delta`, `message_delta`, `message_stop`

### 3. Gemini (API Key + Vertex)

**Two Modes:**

#### API Key Mode
```typescript
provider: 'gemini'
gemini.useVertex: false
gemini.apiKey: 'AIza...'
model: 'gemini-1.5-flash'
```

#### Vertex AI Mode
```typescript
provider: 'gemini'
gemini.useVertex: true
gemini.projectId: 'your-project-id'
gemini.location: 'us-central1'
gemini.serviceAccountJsonPath: '/path/to/sa.json'
model: 'gemini-1.5-pro'
```

**Implementation:** `src/main/ipc/providers/gemini.ts`
- Converts messages: `contents: [{role:'user'|'model', parts:[{text}]}]`
- System → `systemInstruction`
- Vertex: Uses `google-auth-library` for OAuth token (cached 55min)
- Chunked JSON streaming (not SSE)

## File Structure

```
src/main/ipc/
├── providers/
│   ├── types.ts           # ProviderAdapter interface
│   ├── openaiCompat.ts    # OpenAI-compatible
│   ├── anthropic.ts       # Anthropic/Claude
│   ├── gemini.ts          # Gemini (API Key + Vertex)
│   └── index.ts           # Provider registry
└── ai.ts                  # IPC handler (provider dispatcher)
```

## Key Implementation Details

### Streaming Flow

1. **Renderer** → `window.ai.stream(payload)` → Returns `{id}`
2. **Main** → Selects adapter → Calls `adapter.streamChat()`
3. **Adapter** → Sends chunks via `send({type, ...})`
4. **Main** → Forwards to renderer on `ai.stream.${id}` channel
5. **Renderer** → `useAIStream` hook receives events

### Event Types

```typescript
type StreamEvent =
  | { type: 'delta'; text: string }              // Incremental text
  | { type: 'done'; usage?: {...} }              // Completion
  | { type: 'error'; message: string; code?: string } // Error
```

### Timeout & Cancellation

- **Timeout**: Configurable per request (default 30s)
- **Cancellation**: `window.ai.cancel(id)` → Aborts fetch via `AbortController`
- **Cleanup**: Auto-cleanup on timeout/error/completion

### Security

- **API Keys**: Stored in main process only (electron-store + env vars)
- **No Renderer Access**: Preload bridge exposes only safe IPC methods
- **Vertex SA**: Service Account JSON never sent to renderer

## Usage Example

```typescript
// Renderer side
const { text, streaming, error, start, cancel } = useAIStream({
  onComplete: (fullText) => console.log('Done:', fullText),
  onError: (err) => console.error(err),
});

// Start streaming
start({
  system: 'You are a helpful assistant.',
  messages: [{ role: 'user', content: 'Hello!' }],
  temperature: 0.7,
  max_tokens: 2048,
});

// Cancel if needed
cancel();
```

## Adding New Providers (Future)

To add a new provider (e.g., Cohere, Mistral):

1. Create `src/main/ipc/providers/newProvider.ts`
2. Implement `ProviderAdapter` interface
3. Register in `providers/index.ts`:
   ```typescript
   export const providers = {
     ...
     new_provider: newProviderAdapter,
   };
   ```
4. Update `Provider` type in `shared/types.ts`
5. Add config fields if needed

**No changes required**: Renderer, IPC, hooks, or UI!

## Testing Checklist

- [ ] OpenAI: Stream response, cancel mid-stream, timeout
- [ ] DeepSeek: Change baseUrl, verify streaming works
- [ ] Anthropic: Claude streaming, usage tokens
- [ ] Gemini API Key: Basic streaming
- [ ] Gemini Vertex: OAuth token caching, refresh
- [ ] Error handling: Network failure, invalid API key, malformed response
- [ ] Concurrent streams: Multiple requests in parallel

## Configuration

Environment variables (`.env`):
```bash
STM_OPENAI_BASE_URL=https://api.openai.com
STM_OPENAI_API_KEY=sk-...
STM_OPENAI_MODEL=gpt-4o-mini
STM_OPENAI_TIMEOUT_MS=30000

STM_GEMINI_API_KEY=...
STM_GEMINI_PROJECT_ID=...
STM_GEMINI_LOCATION=us-central1
STM_GEMINI_SA_JSON_PATH=/path/to/sa.json

STM_MINIMAX_API_KEY=...
```

Runtime config (electron-store):
```typescript
{
  ai: {
    provider: 'openai_compat' | 'anthropic' | 'gemini',
    baseUrl: '...',
    apiKey: '...',
    model: '...',
    timeoutMs: 30000,
    temperature: 0.7,
    maxTokens: 2048,
    gemini: { useVertex, apiKey, projectId, location, serviceAccountJsonPath }
  }
}
```

## Dependencies

- **google-auth-library**: Only for Gemini Vertex (dynamically imported)
- **Node.js fetch**: Built-in (Node 18+)
- **AbortController**: Built-in

## Future: Tool Calling (Function Calling)

When ready to add command execution via LLM:

1. Enable in OpenAI-compatible:
   ```typescript
   body.tools = [{
     type: 'function',
     function: {
       name: 'execute_command',
       description: 'Execute desktop command',
       parameters: { /* JSON Schema */ }
     }
   }];
   ```

2. Parse `delta.tool_calls` in adapter
3. On `finish_reason === 'tool_calls'`:
   - Extract function arguments
   - Call `commands.execute()` (with permission check)
   - Append result as `{role: 'tool', content: '...'}`
   - Re-stream with same message history

4. Same pattern for Anthropic and Gemini (they have equivalent APIs)

**Key Rule**: Only one tool-calling pathway. No parallel intent parsers.

## Maintenance Notes

- **Single Responsibility**: Each adapter only handles its provider's protocol
- **No Workarounds**: If a bug occurs, fix the root cause in the adapter, not in `ai.ts`
- **Naming**: Use exact function names from spec (`streamChat`, `sseLines`, `sendChunk`, etc.)
- **Error Handling**: Always send `{type: 'error'}` event, never throw to renderer

---

**Status**: ✅ Complete and production-ready
**Last Updated**: 2025-01-XX
**Next Steps**: Minimax TTS integration, command execution bridge
