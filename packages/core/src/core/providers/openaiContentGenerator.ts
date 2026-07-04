/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Content,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentResponse,
} from '@google/genai';
import type {
  ProviderContentGenerator,
  ProviderGenerateRequest,
  ProviderCountTokensRequest,
  ProviderCountTokensResponse,
} from '../llmProvider.js';
import type { LlmRole } from '../../telemetry/llmRole.js';

interface OpenAIConfig {
  providerId: string;
  baseUrl: string;
  apiKey?: string;
  proxy?: string;
  customHeaders?: Record<string, string>;
  organization?: string;
  project?: string;
}

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/**
 * OpenAI-compatible content generator.
 * Translates @google/genai format to OpenAI API format and back.
 */
export class OpenAIContentGenerator implements ProviderContentGenerator {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    // Normalize baseUrl: strip trailing /v1 since we always append /v1/...
    let baseUrl = config.baseUrl;
    if (baseUrl) {
      baseUrl = baseUrl.replace(/\/+$/, '');
      if (baseUrl.endsWith('/v1')) {
        baseUrl = baseUrl.slice(0, -3);
      }
    }
    this.config = { ...config, baseUrl };
  }

  async generateContent(
    request: ProviderGenerateRequest,
    userPromptId: string,
    role: LlmRole,
  ): Promise<GenerateContentResponse> {
    const messages = this.convertContentsToMessages(request.contents);

    const openaiRequest: OpenAIRequest = {
      model: request.model,
      messages,
      stream: false,
    };

    // Apply config options if provided
    if (request.config?.temperature !== undefined) {
      openaiRequest.temperature = request.config.temperature;
    }
    if (request.config?.topP !== undefined) {
      openaiRequest.top_p = request.config.topP;
    }
    if (request.config?.maxOutputTokens !== undefined) {
      openaiRequest.max_tokens = request.config.maxOutputTokens;
    }

    const response = await this.callOpenAI<OpenAIResponse>(openaiRequest, userPromptId, role);

    // Translate OpenAI response back to @google/genai format
    return this.translateOpenAIResponse(response);
  }

  async generateContentStream(
    request: ProviderGenerateRequest,
    userPromptId: string,
    role: LlmRole,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const messages = this.convertContentsToMessages(request.contents);

    const openaiRequest: OpenAIRequest = {
      model: request.model,
      messages,
      stream: true,
    };

    if (request.config?.temperature !== undefined) {
      openaiRequest.temperature = request.config.temperature;
    }
    if (request.config?.topP !== undefined) {
      openaiRequest.top_p = request.config.topP;
    }
    if (request.config?.maxOutputTokens !== undefined) {
      openaiRequest.max_tokens = request.config.maxOutputTokens;
    }

    return this.streamOpenAI(openaiRequest, userPromptId, role);
  }

  async countTokens(request: ProviderCountTokensRequest): Promise<ProviderCountTokensResponse> {
    // OpenAI doesn't have a standard token counting endpoint
    // Use a simple heuristic: ~4 chars per token
    const messages = this.convertContentsToMessages(request.contents);
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);

    return {
      totalTokens: estimatedTokens,
    };
  }

  async embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    // Not commonly supported by local OpenAI-compatible endpoints
    throw new Error('Embedding is not supported by this OpenAI-compatible provider');
  }

  private convertContentsToMessages(contents: Content[]): OpenAIMessage[] {
    return contents.map((content) => {
      const role = content.role === 'user' ? 'user' : 'assistant';
      // Extract text from parts
      const parts = content.parts || [];
      const text = parts
        .map((part) => {
          if (typeof part === 'string') return part;
          if ('text' in part) return part.text;
          return '';
        })
        .join('');
      return { role, content: text };
    });
  }

  private translateOpenAIResponse(response: OpenAIResponse): GenerateContentResponse {
    const assistantContent = response.choices[0]?.message?.content || '';

    return {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [{ text: assistantContent }],
          },
          finishReason: response.choices[0]?.finish_reason || 'STOP',
        },
      ],
      usageMetadata: {
        promptTokenCount: response.usage?.prompt_tokens || 0,
        candidatesTokenCount: response.usage?.completion_tokens || 0,
        totalTokenCount: response.usage?.total_tokens || 0,
        cachedContentTokenCount: 0,
      },
      modelVersion: response.model,
    } as unknown as GenerateContentResponse;
  }

  private async callOpenAI<T>(
    request: OpenAIRequest,
    userPromptId: string,
    role: LlmRole,
  ): Promise<T> {
    const endpoint = `${this.config.baseUrl}/v1/chat/completions`;
    const headers = this.buildHeaders();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API error ${response.status}: ${errorText || response.statusText}`,
      );
    }

    return (await response.json()) as T;
  }

  private async *streamOpenAI(
    request: OpenAIRequest,
    userPromptId: string,
    role: LlmRole,
  ): AsyncGenerator<GenerateContentResponse> {
    const endpoint = `${this.config.baseUrl}/v1/chat/completions`;
    const headers = this.buildHeaders();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API error ${response.status}: ${errorText || response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    let buffer = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let lastYieldedChunk: GenerateContentResponse | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === '[DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(trimmed.slice(6)) as OpenAIStreamChunk;
              const delta = chunk.choices[0]?.delta?.content;
              const finishReason = chunk.choices[0]?.finish_reason;

              if (delta) {
                lastYieldedChunk = {
                  candidates: [
                    {
                      content: {
                        role: 'model',
                        parts: [{ text: delta }],
                      },
                      // No finishReason on delta chunks — only the final STOP
                      // chunk should carry it. A truthy finishReason causes
                      // turn.js to emit GeminiEventType.Finished prematurely.
                    },
                  ],
                  modelVersion: chunk.model,
                } as unknown as GenerateContentResponse;
                yield lastYieldedChunk;
              } else if (finishReason === 'stop' || finishReason === 'STOP') {
                // Stop chunk with no delta — patch the last yielded chunk to
                // carry STOP so the Gemini client sees a proper finish reason.
                // We yield a minimal STOP chunk with a single space so parts
                // is non-empty (avoids the next-speaker-checker infinite loop).
                yield {
                  candidates: [
                    {
                      content: { role: 'model', parts: [{ text: '' }] },
                      finishReason: 'STOP',
                    },
                  ],
                  usageMetadata: { totalTokenCount: 0 },
                } as unknown as GenerateContentResponse;
                lastYieldedChunk = null; // already handled
              }
            } catch {
              // Ignore malformed JSON chunks
            }
          }
        }
      }

      // If the proxy never sent an explicit finish_reason=stop chunk, emit one
      // now with a single empty-text part so parts.length > 0 (prevents the
      // next-speaker-checker from triggering another model turn).
      if (lastYieldedChunk !== null) {
        yield {
          candidates: [
            {
              content: { role: 'model', parts: [{ text: '' }] },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: { totalTokenCount: 0 },
        } as unknown as GenerateContentResponse;
      }
    } finally {
      reader.releaseLock();
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    if (this.config.organization) {
      headers['OpenAI-Organization'] = this.config.organization;
    }

    if (this.config.project) {
      headers['OpenAI-Project'] = this.config.project;
    }

    if (this.config.customHeaders) {
      Object.assign(headers, this.config.customHeaders);
    }

    return headers;
  }
}
