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
  Part,
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
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  tools?: OpenAITool[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
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
      content: string | null;
      tool_calls?: OpenAIToolCall[];
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
      content?: string | null;
      tool_calls?: OpenAIToolCall[];
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
    _userPromptId: string,
    _role: LlmRole,
  ): Promise<GenerateContentResponse> {
    const messages = this.convertContentsToMessages(request.contents);

    const openaiRequest: OpenAIRequest = {
      model: request.model,
      messages,
      stream: false,
    };

    // Add tools if provided
    if (request.config?.tools) {
      openaiRequest.tools = this.convertToolsToOpenAI(request.config.tools);
      openaiRequest.tool_choice = 'auto';
    }

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

    const response = await this.callOpenAI<OpenAIResponse>(openaiRequest);

    // Translate OpenAI response back to @google/genai format
    return this.translateOpenAIResponse(response);
  }

  async generateContentStream(
    request: ProviderGenerateRequest,
    _userPromptId: string,
    _role: LlmRole,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const messages = this.convertContentsToMessages(request.contents);

    const openaiRequest: OpenAIRequest = {
      model: request.model,
      messages,
      stream: true,
    };

    // Add tools if provided
    if (request.config?.tools) {
      openaiRequest.tools = this.convertToolsToOpenAI(request.config.tools);
      openaiRequest.tool_choice = 'auto';
    }

    if (request.config?.temperature !== undefined) {
      openaiRequest.temperature = request.config.temperature;
    }
    if (request.config?.topP !== undefined) {
      openaiRequest.top_p = request.config.topP;
    }
    if (request.config?.maxOutputTokens !== undefined) {
      openaiRequest.max_tokens = request.config.maxOutputTokens;
    }

    return this.streamOpenAI(openaiRequest);
  }

  async countTokens(request: ProviderCountTokensRequest): Promise<ProviderCountTokensResponse> {
    // OpenAI doesn't have a standard token counting endpoint
    // Use a simple heuristic: ~4 chars per token
    const messages = this.convertContentsToMessages(request.contents);
    const totalChars = messages.reduce((sum, msg) => sum + (msg.content?.length ?? 0), 0);
    const estimatedTokens = Math.ceil(totalChars / 4);

    return {
      totalTokens: estimatedTokens,
    };
  }

  async embedContent(_request: EmbedContentParameters): Promise<EmbedContentResponse> {
    // Not commonly supported by local OpenAI-compatible endpoints
    throw new Error('Embedding is not supported by this OpenAI-compatible provider');
  }

  private convertContentsToMessages(contents: Content[]): OpenAIMessage[] {
    const messages: OpenAIMessage[] = [];

    for (const content of contents) {
      const role = content.role === 'model' ? 'assistant' : 'user';
      const textParts: string[] = [];
      const toolCalls: OpenAIToolCall[] = [];
      let toolCallId: string | undefined;
      let toolName: string | undefined;
      let functionResponseContent: string | null = null;

      for (const part of content.parts || []) {
        if (typeof part === 'string') {
          textParts.push(part);
        } else if ('text' in part) {
          textParts.push(part.text);
        } else if ('functionCall' in part) {
          toolCalls.push({
            id: part.functionCall.id ?? part.functionCall.name ?? 'call',
            type: 'function',
            function: {
              name: part.functionCall.name ?? '',
              arguments: JSON.stringify(part.functionCall.args ?? {}),
            },
          });
        } else if ('functionResponse' in part) {
          toolCallId = part.functionResponse.id;
          toolName = part.functionResponse.name;
          functionResponseContent = JSON.stringify(part.functionResponse.response ?? {});
        }
      }

      if (toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: textParts.join('') || null,
          tool_calls: toolCalls,
        });
      }

      if (toolCallId) {
        messages.push({
          role: 'tool',
          content: functionResponseContent,
          tool_call_id: toolCallId,
          name: toolName,
        });
      } else if (toolCalls.length === 0) {
        messages.push({
          role,
          content: textParts.join('') || null,
        });
      }
    }

    return messages;
  }

  private convertToolsToOpenAI(tools: any[]): OpenAITool[] {
    const openaiTools: OpenAITool[] = [];
    for (const tool of tools) {
      if (tool.functionDeclarations) {
        for (const func of tool.functionDeclarations) {
          openaiTools.push({
            type: 'function',
            function: {
              name: func.name,
              description: func.description,
              parameters: func.parameters,
            },
          });
        }
      }
    }
    return openaiTools;
  }

  private translateOpenAIResponse(response: OpenAIResponse): GenerateContentResponse {
    const message = response.choices[0]?.message;
    const parts: Part[] = [];

    if (message?.content) {
      parts.push({ text: message.content });
    }

    if (message?.tool_calls) {
      for (const tc of message.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = { _raw: tc.function.arguments };
        }
        parts.push({
          functionCall: {
            id: tc.id,
            name: tc.function.name,
            args,
          },
        } as Part);
      }
    }

    return {
      candidates: [
        {
          content: {
            role: 'model',
            parts,
          },
          finishReason: (response.choices[0]?.finish_reason?.toUpperCase() as any) || 'STOP',
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

  private async callOpenAI<T>(request: OpenAIRequest): Promise<T> {
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

  private async *streamOpenAI(request: OpenAIRequest): AsyncGenerator<GenerateContentResponse> {
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
              const choice = chunk.choices[0];
              const delta = choice?.delta;
              const finishReason = choice?.finish_reason;

              if (delta?.content || delta?.tool_calls) {
                const parts: Part[] = [];
                if (delta.content) {
                  parts.push({ text: delta.content });
                }
                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    let args = {};
                    if (tc.function?.arguments) {
                      try {
                        args = JSON.parse(tc.function.arguments);
                      } catch {
                        args = { _raw: tc.function.arguments };
                      }
                    }
                    parts.push({
                      functionCall: {
                        id: tc.id,
                        name: tc.function?.name,
                        args,
                      },
                    } as Part);
                  }
                }

                lastYieldedChunk = {
                  candidates: [
                    {
                      content: {
                        role: 'model',
                        parts,
                      },
                    },
                  ],
                  modelVersion: chunk.model,
                } as unknown as GenerateContentResponse;
                yield lastYieldedChunk;
              } else if (
                finishReason === 'stop' ||
                finishReason === 'STOP' ||
                finishReason === 'tool_calls'
              ) {
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
