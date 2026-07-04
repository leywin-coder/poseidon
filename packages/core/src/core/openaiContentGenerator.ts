/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentResponse,
} from '@google/genai';
import type {
  ProviderContentGenerator,
  ProviderCountTokensRequest,
  ProviderCountTokensResponse,
  ProviderGenerateRequest,
} from './llmProvider.js';
import type { LlmRole } from '../telemetry/llmRole.js';
import {
  geminiToOpenaiMessages,
  geminiToOpenaiTools,
  openaiStreamChunkToGeminiResponse,
  openaiToGeminiResponse,
  type OpenAiChatCompletion,
  type OpenAiStreamChunk,
} from './providerMessageTranslator.js';

/**
 * OpenAI SDK type stubs — these mirror the OpenAI v5 SDK interface
 * without requiring the package as a hard dependency. The actual OpenAI
 * client is loaded dynamically at construction time.
 */
interface OpenAiClient {
  chat: {
    completions: {
      create(
        body: Record<string, unknown>,
      ): Promise<OpenAiChatCompletion>;
    };
  };
  embeddings: {
    create(
      body: Record<string, unknown>,
    ): Promise<{ data: Array<{ embedding: number[] }> }>;
  };
}

/**
 * Options for the OpenAI content generator.
 */
export interface OpenAiContentGeneratorOptions {
  model: string;
  apiKey: string;
  baseUrl?: string;
  organization?: string;
  project?: string;
  defaultModel?: string;
}

/**
 * A ContentGenerator that wraps the OpenAI SDK, translating requests and
 * responses between Gemini's @google/genai types and OpenAI's format.
 *
 * This allows the existing agent loop (GeminiChat, Turn, Scheduler) to work
 * with OpenAI models without any changes to the core loop logic.
 */
export class OpenAIContentGenerator implements ProviderContentGenerator {
  private client: OpenAiClient | undefined;
  private readonly defaultModel: string;

  constructor(private readonly options: OpenAiContentGeneratorOptions) {
    this.defaultModel = options.defaultModel ?? 'gpt-4o';
  }

  /**
   * Lazily initialize the OpenAI client.
   * Dynamically imports the 'openai' package to avoid a hard dependency.
   */
  private async getClient(): Promise<OpenAiClient> {
    if (this.client) return this.client;

    try {
      // Dynamic import — the 'openai' package must be installed separately.
      // This keeps it out of the core dependency tree for users who only
      // use Google providers.
      const { default: OpenAI } = await import('openai');
      this.client = new OpenAI({
        apiKey: this.options.apiKey,
        baseURL: this.options.baseUrl,
        organization: this.options.organization,
        project: this.options.project,
      }) as unknown as OpenAiClient;
    } catch (error) {
      throw new Error(
        `Failed to import OpenAI SDK. Install it with: npm install openai\n` +
          `Original error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return this.client;
  }

  async generateContent(
    request: ProviderGenerateRequest,
    _userPromptId: string,
    _role: LlmRole,
  ): Promise<GenerateContentResponse> {
    const client = await this.getClient();
    const model = request.model || this.defaultModel;

    const messages = geminiToOpenaiMessages(
      request.contents,
      request.config?.systemInstruction as string | undefined,
    );

    const body: Record<string, unknown> = {
      model,
      messages,
    };

    // Add tools if present
    if (request.config?.['tools']) {
      body['tools'] = geminiToOpenaiTools(request.config['tools']);
      body['tool_choice'] = 'auto';
    }

    // Map Gemini config to OpenAI params
    if (request.config) {
      if (request.config['temperature'] !== undefined) {
        body['temperature'] = request.config['temperature'];
      }
      if (request.config['topP'] !== undefined) {
        body['top_p'] = request.config['topP'];
      }
      if (request.config['maxOutputTokens'] !== undefined) {
        body['max_tokens'] = request.config['maxOutputTokens'];
      }
      if (request.config['stopSequences']) {
        body['stop'] = request.config['stopSequences'];
      }
    }

    const completion = await client.chat.completions.create(body);
    return openaiToGeminiResponse(completion);
  }

  async generateContentStream(
    request: ProviderGenerateRequest,
    _userPromptId: string,
    _role: LlmRole,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const client = await this.getClient();
    const model = request.model || this.defaultModel;

    const messages = geminiToOpenaiMessages(
      request.contents,
      request.config?.systemInstruction as string | undefined,
    );

    const body: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    };

    if (request.config?.['tools']) {
      body['tools'] = geminiToOpenaiTools(request.config['tools']);
      body['tool_choice'] = 'auto';
    }

    if (request.config) {
      if (request.config['temperature'] !== undefined) {
        body['temperature'] = request.config['temperature'];
      }
      if (request.config['topP'] !== undefined) {
        body['top_p'] = request.config['topP'];
      }
      if (request.config['maxOutputTokens'] !== undefined) {
        body['max_tokens'] = request.config['maxOutputTokens'];
      }
    }

    const stream = await client.chat.completions.create(body);

    // Wrap the OpenAI stream to translate chunks to Gemini format
    async function* generator(): AsyncGenerator<GenerateContentResponse> {
      for await (const chunk of stream as unknown as AsyncIterable<OpenAiStreamChunk>) {
        yield openaiStreamChunkToGeminiResponse(chunk);
      }
    }

    return generator();
  }

  async countTokens(
    request: ProviderCountTokensRequest,
  ): Promise<ProviderCountTokensResponse> {
    // OpenAI doesn't have a direct countTokens endpoint in the same way.
    // We estimate based on the rule of thumb: ~4 characters per token.
    // For production use, consider using tiktoken or the OpenAI API's
    // token counting endpoint.
    let totalChars = 0;
    for (const content of request.contents) {
      for (const part of content.parts ?? []) {
        if (part.text) {
          totalChars += part.text.length;
        }
        if (part.functionCall) {
          totalChars += JSON.stringify(part.functionCall.args).length;
          totalChars += part.functionCall.name?.length ?? 0;
        }
        if (part.functionResponse) {
          totalChars += JSON.stringify(part.functionResponse.response).length;
        }
      }
    }

    // Rough approximation: 1 token ≈ 4 characters
    return { totalTokens: Math.ceil(totalChars / 4) };
  }

  async embedContent(
    request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    const client = await this.getClient();
    const texts = Array.isArray(request.contents)
      ? request.contents
      : [request.contents];

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    return {
      embeddings: response.data.map((d) => ({ values: d.embedding })),
    };
  }
}
