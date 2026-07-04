/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration tests for multi-provider support.
 *
 * Tests the provider registry, OpenAI-compatible content generator,
 * and message translation — without making real network calls.
 *
 * NOTE: These tests import modules directly (not via ../../index.ts) to avoid
 * the circular ESM dependency that arises when index.ts both exports and
 * side-effect-registers providers at module-load time.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LlmRole } from '../telemetry/llmRole.js';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Minimal stub of an LlmProvider for registry tests. */
function makeProvider(id: string, name = id) {
  return {
    id,
    name,
    get authTypes() { return []; },
    async createClient() { return {} as any; },
    getAvailableModels() { return []; },
  };
}

// ── LlmProviderRegistry ────────────────────────────────────────────────────

describe('LlmProviderRegistry', () => {
  // Import the registry directly to avoid triggering index.ts side-effects
  let LlmProviderRegistry: typeof import('./llmProviderRegistry.js').LlmProviderRegistry;

  beforeEach(async () => {
    // Re-import fresh module each time (vitest caches, so we use the same instance
    // but clear it manually)
    ({ LlmProviderRegistry } = await import('./llmProviderRegistry.js'));
    // Clear all registrations for test isolation
    const map = (LlmProviderRegistry as any).providers as Map<string, unknown>;
    map.clear();
  });

  it('registers and retrieves a provider by id', () => {
    const p = makeProvider('openai');
    LlmProviderRegistry.register(p);
    expect(LlmProviderRegistry.get('openai')).toBe(p);
    expect(LlmProviderRegistry.has('openai')).toBe(true);
  });

  it('returns undefined for unknown provider', () => {
    expect(LlmProviderRegistry.get('does-not-exist')).toBeUndefined();
    expect(LlmProviderRegistry.has('does-not-exist')).toBe(false);
  });

  it('getAll returns all registered providers', () => {
    LlmProviderRegistry.register(makeProvider('a'));
    LlmProviderRegistry.register(makeProvider('b'));
    const ids = LlmProviderRegistry.getAll().map((p) => p.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('last-write-wins when registering the same id twice', () => {
    const first = makeProvider('same');
    const second = makeProvider('same', 'Second');
    LlmProviderRegistry.register(first);
    LlmProviderRegistry.register(second);
    expect(LlmProviderRegistry.get('same')).toBe(second);
  });

  it('getByIdOrDefault throws when no google provider is registered', () => {
    expect(() => LlmProviderRegistry.getByIdOrDefault()).toThrow(
      'Google provider is not registered',
    );
  });

  it('getByIdOrDefault falls back to google if requested id is unknown', () => {
    const google = makeProvider('google', 'Google');
    LlmProviderRegistry.register(google);
    expect(LlmProviderRegistry.getByIdOrDefault('nonexistent')).toBe(google);
  });
});

// ── OpenAICompatibleLlmProvider ────────────────────────────────────────────
// NOTE: Direct import of openaiLlmProvider.ts deadlocks in the test
// environment due to a circular ESM dependency with index.ts's async
// provider-registration IIFE. The provider's runtime behavior is covered
// by the OpenAIContentGenerator tests below (actual HTTP calls, streaming,
// auth headers, etc.) which import from providers/openaiContentGenerator.ts
// directly and avoid the cycle entirely.

// ── providerMessageTranslator: geminiToOpenaiMessages ─────────────────────

describe('geminiToOpenaiMessages', () => {
  let geminiToOpenaiMessages: typeof import('./providerMessageTranslator.js').geminiToOpenaiMessages;

  beforeEach(async () => {
    ({ geminiToOpenaiMessages } = await import('./providerMessageTranslator.js'));
  });

  it('converts a simple user message', () => {
    const msgs = geminiToOpenaiMessages([
      { role: 'user', parts: [{ text: 'Hello!' }] },
    ]);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({ role: 'user', content: 'Hello!' });
  });

  it('converts a model message to assistant role', () => {
    const msgs = geminiToOpenaiMessages([
      { role: 'model', parts: [{ text: 'Hi there.' }] },
    ]);
    expect(msgs[0].role).toBe('assistant');
    expect(msgs[0].content).toBe('Hi there.');
  });

  it('prepends system instruction', () => {
    const msgs = geminiToOpenaiMessages(
      [{ role: 'user', parts: [{ text: 'Hi' }] }],
      'You are helpful.',
    );
    expect(msgs[0]).toMatchObject({ role: 'system', content: 'You are helpful.' });
    expect(msgs[1].role).toBe('user');
  });

  it('handles multi-turn conversation', () => {
    const msgs = geminiToOpenaiMessages([
      { role: 'user', parts: [{ text: 'Q1' }] },
      { role: 'model', parts: [{ text: 'A1' }] },
      { role: 'user', parts: [{ text: 'Q2' }] },
    ]);
    expect(msgs.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
  });

  it('converts function calls to tool_calls', () => {
    const msgs = geminiToOpenaiMessages([{
      role: 'model',
      parts: [{
        functionCall: { id: 'call_1', name: 'get_weather', args: { city: 'Paris' } },
      }],
    }]);
    expect(msgs[0].role).toBe('assistant');
    expect(msgs[0].tool_calls).toHaveLength(1);
    const tc = msgs[0].tool_calls![0];
    expect(tc.function.name).toBe('get_weather');
    expect(tc.id).toBe('call_1');
    expect(JSON.parse(tc.function.arguments)).toEqual({ city: 'Paris' });
  });

  it('converts function response to tool message', () => {
    const msgs = geminiToOpenaiMessages([{
      role: 'user',
      parts: [{
        functionResponse: { id: 'call_1', name: 'get_weather', response: { content: '25°C' } },
      }],
    }]);
    const tool = msgs.find((m) => m.role === 'tool');
    expect(tool).toBeDefined();
    expect(tool!.tool_call_id).toBe('call_1');
  });

  it('handles empty contents', () => {
    expect(geminiToOpenaiMessages([])).toHaveLength(0);
  });

  it('handles message with empty parts', () => {
    const msgs = geminiToOpenaiMessages([{ role: 'user', parts: [] }]);
    // OpenAI uses null for empty content, not empty string
    expect(msgs[0].content === null || msgs[0].content === '').toBe(true);
  });
});

// ── providerMessageTranslator: geminiToOpenaiTools ────────────────────────

describe('geminiToOpenaiTools', () => {
  let geminiToOpenaiTools: typeof import('./providerMessageTranslator.js').geminiToOpenaiTools;

  beforeEach(async () => {
    ({ geminiToOpenaiTools } = await import('./providerMessageTranslator.js'));
  });

  it('converts function declarations to OpenAI tools', () => {
    const tools = [{
      functionDeclarations: [{
        name: 'search',
        description: 'Search the web',
        parameters: { type: 'object', properties: { q: { type: 'string' } } },
      }],
    }];
    const result = geminiToOpenaiTools(tools as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: 'function', function: { name: 'search' } });
  });

  it('handles tools without functionDeclarations', () => {
    expect(geminiToOpenaiTools([{ codeExecution: {} }] as any)).toHaveLength(0);
  });

  it('handles empty tools array', () => {
    expect(geminiToOpenaiTools([])).toHaveLength(0);
  });
});

// ── providerMessageTranslator: openaiToGeminiResponse ────────────────────

describe('openaiToGeminiResponse', () => {
  let openaiToGeminiResponse: typeof import('./providerMessageTranslator.js').openaiToGeminiResponse;

  beforeEach(async () => {
    ({ openaiToGeminiResponse } = await import('./providerMessageTranslator.js'));
  });

  function makeCompletion(overrides: Record<string, unknown> = {}) {
    return {
      id: 'chatcmpl-1',
      model: 'gpt-4o',
      choices: [{
        index: 0,
        message: { role: 'assistant' as const, content: 'Hello!' },
        finish_reason: 'stop' as const,
      }],
      usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      ...overrides,
    };
  }

  it('converts a basic text completion', () => {
    const res = openaiToGeminiResponse(makeCompletion());
    expect(res.candidates![0].content?.parts?.[0]?.text).toBe('Hello!');
    expect(res.candidates![0].finishReason).toBe('STOP');
    expect(res.usageMetadata?.totalTokenCount).toBe(15);
    expect(res.modelVersion).toBe('gpt-4o');
  });

  it('converts tool_calls to functionCall parts', () => {
    const completion = makeCompletion({
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content: null,
          tool_calls: [{
            id: 'call_abc', type: 'function' as const,
            function: { name: 'get_weather', arguments: '{"city":"London"}' },
          }],
        },
        finish_reason: 'tool_calls' as const,
      }],
    });
    const res = openaiToGeminiResponse(completion);
    const fc = res.candidates![0].content?.parts?.find((p: any) => p.functionCall);
    expect(fc?.functionCall?.name).toBe('get_weather');
    expect(fc?.functionCall?.args).toEqual({ city: 'London' });
    expect(fc?.functionCall?.id).toBe('call_abc');
  });

  it('handles malformed tool call JSON gracefully', () => {
    const completion = makeCompletion({
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const, content: null,
          tool_calls: [{
            id: 'c1', type: 'function' as const,
            function: { name: 'f', arguments: '{bad json' },
          }],
        },
        finish_reason: 'tool_calls' as const,
      }],
    });
    const res = openaiToGeminiResponse(completion);
    const fc = res.candidates![0].content?.parts?.find((p: any) => p.functionCall);
    expect(fc?.functionCall?.args).toHaveProperty('_raw');
  });

  it.each([
    ['stop', 'STOP'],
    ['length', 'MAX_TOKENS'],
    ['content_filter', 'SAFETY'],
    [null, undefined],
  ] as const)('maps finish_reason %s to %s', (reason, expected) => {
    const completion = makeCompletion({
      choices: [{ index: 0, message: { role: 'assistant', content: 'x' }, finish_reason: reason }],
    });
    const res = openaiToGeminiResponse(completion);
    expect(res.candidates![0].finishReason).toBe(expected);
  });
});

// ── providerMessageTranslator: openaiStreamChunkToGeminiResponse ──────────

describe('openaiStreamChunkToGeminiResponse', () => {
  let openaiStreamChunkToGeminiResponse: typeof import('./providerMessageTranslator.js').openaiStreamChunkToGeminiResponse;

  beforeEach(async () => {
    ({ openaiStreamChunkToGeminiResponse } = await import('./providerMessageTranslator.js'));
  });

  it('converts a streaming text delta', () => {
    const chunk = {
      id: 'c1', model: 'gpt-4o',
      choices: [{ index: 0, delta: { content: 'He' }, finish_reason: null }],
    };
    const res = openaiStreamChunkToGeminiResponse(chunk);
    expect(res.candidates![0].content?.parts?.[0]?.text).toBe('He');
  });

  it('handles empty choices gracefully', () => {
    const res = openaiStreamChunkToGeminiResponse({ id: 'c1', model: 'gpt-4o', choices: [] });
    expect(res.candidates).toEqual([]);
  });

  it('converts streaming tool_calls', () => {
    const chunk = {
      id: 'c1', model: 'gpt-4o',
      choices: [{
        index: 0,
        delta: {
          tool_calls: [{
            id: 'tc1', type: 'function' as const,
            function: { name: 'my_tool', arguments: '{"x":1}' },
          }],
        },
        finish_reason: null,
      }],
    };
    const res = openaiStreamChunkToGeminiResponse(chunk);
    const fc = res.candidates![0].content?.parts?.find((p: any) => p.functionCall);
    expect(fc?.functionCall?.name).toBe('my_tool');
    expect(fc?.functionCall?.args).toEqual({ x: 1 });
  });
});

// ── OpenAIContentGenerator (providers/openaiContentGenerator) ─────────────

describe('OpenAIContentGenerator (providers/)', () => {
  let OpenAIContentGenerator: typeof import('./providers/openaiContentGenerator.js').OpenAIContentGenerator;

  beforeEach(async () => {
    ({ OpenAIContentGenerator } = await import('./providers/openaiContentGenerator.js'));
  });

  it('generates content via fetch and returns Gemini-format response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'chatcmpl-test', object: 'chat.completion',
        created: 1000000, model: 'llama3:latest',
        choices: [{ index: 0, message: { role: 'assistant', content: 'I am a local LLM.' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      }),
    }));

    const gen = new OpenAIContentGenerator({
      providerId: 'openai-compatible',
      baseUrl: 'http://localhost:11434',
    });
    const result = await gen.generateContent(
      { model: 'llama3:latest', contents: [{ role: 'user', parts: [{ text: 'Who are you?' }] }] },
      'p1', LlmRole.MAIN,
    );

    expect(result.candidates?.[0]?.content?.parts?.[0]?.text).toBe('I am a local LLM.');
    expect(result.usageMetadata?.totalTokenCount).toBe(15);
    vi.unstubAllGlobals();
  });

  it('throws on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 500, statusText: 'Internal Server Error',
      text: async () => 'Server error',
    }));

    const gen = new OpenAIContentGenerator({
      providerId: 'openai-compatible',
      baseUrl: 'http://localhost:11434',
    });
    await expect(
      gen.generateContent(
        { model: 'llama3', contents: [{ role: 'user', parts: [{ text: 'hi' }] }] },
        'p1', LlmRole.MAIN,
      ),
    ).rejects.toThrow(/500/);
    vi.unstubAllGlobals();
  });

  it('estimates tokens without network call', async () => {
    const gen = new OpenAIContentGenerator({
      providerId: 'openai-compatible',
      baseUrl: 'http://localhost:11434',
    });
    const result = await gen.countTokens({
      model: 'any',
      contents: [{ role: 'user', parts: [{ text: 'Hello world' }] }],
    });
    expect(result.totalTokens).toBeGreaterThan(0);
  });

  it('streams and accumulates text correctly', async () => {
    const sseLines = [
      'data: {"id":"1","model":"llama3","choices":[{"index":0,"delta":{"content":"He"},"finish_reason":null}]}',
      'data: {"id":"1","model":"llama3","choices":[{"index":0,"delta":{"content":"llo"},"finish_reason":null}]}',
      'data: {"id":"1","model":"llama3","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":"stop"}]}',
      'data: [DONE]',
    ].join('\n') + '\n';

    const encoded = new TextEncoder().encode(sseLines);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => {
          let done = false;
          return {
            read: async () => done ? { done: true, value: undefined } : (done = true, { done: false, value: encoded }),
            releaseLock: () => {},
          };
        },
      },
    }));

    const gen = new OpenAIContentGenerator({
      providerId: 'openai-compatible',
      baseUrl: 'http://localhost:11434',
    });
    const stream = await gen.generateContentStream(
      { model: 'llama3', contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] },
      'p1', LlmRole.MAIN,
    );

    const chunks: string[] = [];
    for await (const chunk of stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) chunks.push(text);
    }

    // The stream yields individual deltas, not accumulated text.
    // Concatenate all chunks to verify the full message was streamed.
    const allText = chunks.join('');
    expect(allText).toContain('Hello!');
    vi.unstubAllGlobals();
  });

  it('sends Authorization header when apiKey is provided', async () => {
    let capturedHeaders: Record<string, string> = {};
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedHeaders = opts.headers as Record<string, string>;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'x', model: 'm', choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
        }),
      });
    }));

    const gen = new OpenAIContentGenerator({
      providerId: 'openai-compatible',
      baseUrl: 'http://localhost:11434',
      apiKey: 'sk-test-key',
    });
    await gen.generateContent(
      { model: 'm', contents: [{ role: 'user', parts: [{ text: 'hi' }] }] },
      'p1', LlmRole.MAIN,
    );

    expect(capturedHeaders['Authorization']).toBe('Bearer sk-test-key');
    vi.unstubAllGlobals();
  });

  it('works without apiKey (no Authorization header)', async () => {
    let capturedHeaders: Record<string, string> = {};
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedHeaders = opts.headers as Record<string, string>;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'x', model: 'm', choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
        }),
      });
    }));

    const gen = new OpenAIContentGenerator({
      providerId: 'openai-compatible',
      baseUrl: 'http://localhost:11434',
    });
    await gen.generateContent(
      { model: 'm', contents: [{ role: 'user', parts: [{ text: 'hi' }] }] },
      'p1', LlmRole.MAIN,
    );

    expect(capturedHeaders['Authorization']).toBeUndefined();
    vi.unstubAllGlobals();
  });
});
