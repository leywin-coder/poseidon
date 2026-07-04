/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Content,
  FunctionCall,
  FunctionDeclaration,
  FunctionResponse,
  GenerateContentResponse,
  Part,
  Tool,
  ToolListUnion,
} from '@google/genai';
import type { FinishReason } from '@google/genai';

/**
 * Translation helpers between OpenAI chat-completions format and Gemini
 * @google/genai types.
 *
 * These are pure functions with no side effects, making them easy to test.
 * The OpenAI format is:
 *   { role: 'user' | 'assistant' | 'system' | 'tool', content: string | null, tool_calls?: [...], tool_call_id?: string }
 * The Gemini format is:
 *   { role: 'user' | 'model', parts: Part[] }
 */

/** OpenAI message role. */
export type OpenAiRole = 'system' | 'user' | 'assistant' | 'tool';

/** OpenAI chat message structure. */
export interface OpenAiMessage {
  role: OpenAiRole;
  content: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
  name?: string;
}

/** OpenAI tool call structure. */
export interface OpenAiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/** OpenAI tool definition. */
export interface OpenAiTool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

/** OpenAI chat completion response choice. */
export interface OpenAiChoice {
  index: number;
  message: OpenAiMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

/** OpenAI chat completion response. */
export interface OpenAiChatCompletion {
  id: string;
  choices: OpenAiChoice[];
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** OpenAI streaming delta. */
export interface OpenAiStreamDelta {
  role?: OpenAiRole;
  content?: string | null;
  tool_calls?: OpenAiToolCall[];
}

/** OpenAI streaming choice. */
export interface OpenAiStreamChoice {
  index: number;
  delta: OpenAiStreamDelta;
  finish_reason: OpenAiChoice['finish_reason'];
}

/** OpenAI streaming chunk. */
export interface OpenAiStreamChunk {
  id: string;
  choices: OpenAiStreamChoice[];
  model: string;
  usage?: OpenAiChatCompletion['usage'];
}

/**
 * Convert Gemini Content[] to OpenAI messages.
 * System instructions are prepended as system messages.
 */
export function geminiToOpenaiMessages(
  contents: Content[],
  systemInstruction?: string,
): OpenAiMessage[] {
  const messages: OpenAiMessage[] = [];

  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  for (const content of contents) {
    const role = content.role === 'model' ? 'assistant' : 'user';
    const textParts: string[] = [];
    const toolCalls: OpenAiToolCall[] = [];
    let toolCallId: string | undefined;
    let toolName: string | undefined;
    let functionResponseContent: string | null = null;

    for (const part of content.parts ?? []) {
      if (part.text) {
        textParts.push(part.text);
      }
      if (part.functionCall) {
        toolCalls.push({
          id: part.functionCall.id ?? part.functionCall.name ?? 'call',
          type: 'function',
          function: {
            name: part.functionCall.name ?? '',
            arguments: JSON.stringify(part.functionCall.args ?? {}),
          },
        });
      }
      if (part.functionResponse) {
        toolCallId = part.functionResponse.id;
        toolName = part.functionResponse.name;
        functionResponseContent = formatFunctionResponse(part.functionResponse);
      }
    }

    if (toolCalls.length > 0) {
      // Assistant message with tool calls
      messages.push({
        role: 'assistant',
        content: textParts.join('') || null,
        tool_calls: toolCalls,
      });
    }

    if (toolCallId) {
      // Tool response message
      messages.push({
        role: 'tool',
        content: functionResponseContent,
        tool_call_id: toolCallId,
        name: toolName,
      });
    } else if (toolCalls.length === 0) {
      // Regular text message
      messages.push({
        role,
        content: textParts.join('') || null,
      });
    }
  }

  return messages;
}

/**
 * Format a function response as a string for OpenAI's tool message content.
 */
function formatFunctionResponse(response: FunctionResponse): string {
  if (typeof response.response === 'string') {
    return response.response;
  }
  if (response.response?.['content']) {
    // Extract text from Gemini-style response content
    const content = response.response['content'] as Content;
    if (content.parts) {
      return content.parts
        .filter((p): p is Part & { text: string } => typeof p.text === 'string')
        .map((p) => p.text)
        .join('');
    }
  }
  return JSON.stringify(response.response ?? {});
}

/**
 * Convert Gemini Tool[] to OpenAI tools format.
 */
export function geminiToOpenaiTools(tools: ToolListUnion): OpenAiTool[] {
  const openaiTools: OpenAiTool[] = [];

  for (const tool of tools) {
    const functionDeclarations = (tool as Tool).functionDeclarations;
    if (!functionDeclarations) continue;
    for (const func of functionDeclarations) {
      openaiTools.push({
        type: 'function',
        function: {
          name: func.name ?? '',
          description: func.description,
          parameters: func.parameters as Record<string, unknown> | undefined,
        },
      });
    }
  }

  return openaiTools;
}

/**
 * Convert an OpenAI chat completion response to Gemini GenerateContentResponse.
 */
export function openaiToGeminiResponse(
  completion: OpenAiChatCompletion,
): GenerateContentResponse {
  const choice = completion.choices[0];
  const parts: Part[] = [];

  if (choice.message.content) {
    parts.push({ text: choice.message.content });
  }

  if (choice.message.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch {
        // If arguments aren't valid JSON, pass them as a raw string
        args = { _raw: tc.function.arguments };
      }
      parts.push({
        functionCall: {
          id: tc.id,
          name: tc.function.name,
          args,
        } as FunctionCall,
      });
    }
  }

  return {
    candidates: [
      {
        content: {
          role: 'model',
          parts,
        },
        finishReason: mapOpenAiFinishReason(choice.finish_reason),
        index: 0,
      },
    ],
    modelVersion: completion.model,
    responseId: completion.id,
    usageMetadata: completion.usage
      ? {
          promptTokenCount: completion.usage.prompt_tokens,
          candidatesTokenCount: completion.usage.completion_tokens,
          totalTokenCount: completion.usage.total_tokens,
        }
      : undefined,
  } as unknown as GenerateContentResponse;
}

/**
 * Convert an OpenAI streaming chunk to Gemini GenerateContentResponse.
 */
export function openaiStreamChunkToGeminiResponse(
  chunk: OpenAiStreamChunk,
): GenerateContentResponse {
  const choice = chunk.choices[0];
  if (!choice) {
    return { candidates: [] } as unknown as GenerateContentResponse;
  }

  const parts: Part[] = [];

  if (choice.delta.content) {
    parts.push({ text: choice.delta.content });
  }

  if (choice.delta.tool_calls) {
    for (const tc of choice.delta.tool_calls) {
      // Streaming tool calls may have partial arguments
      let args: Record<string, unknown> = {};
      if (tc.function.arguments) {
        try {
          args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        } catch {
          // Partial JSON in streaming — send as raw for now
          // The caller (GeminiChat.processStreamResponse) will handle consolidation
          args = { _raw: tc.function.arguments };
        }
      }
      parts.push({
        functionCall: {
          id: tc.id,
          name: tc.function.name,
          args,
        } as FunctionCall,
      });
    }
  }

  return {
    candidates: [
      {
        content: {
          role: 'model',
          parts,
        },
        finishReason: mapOpenAiFinishReason(choice.finish_reason),
        index: 0,
      },
    ],
    modelVersion: chunk.model,
    responseId: chunk.id,
    usageMetadata: chunk.usage
      ? {
          promptTokenCount: chunk.usage.prompt_tokens,
          candidatesTokenCount: chunk.usage.completion_tokens,
          totalTokenCount: chunk.usage.total_tokens,
        }
      : undefined,
  } as unknown as GenerateContentResponse;
}

/**
 * Map OpenAI finish reasons to Gemini FinishReason values.
 */
function mapOpenAiFinishReason(
  reason: OpenAiChoice['finish_reason'],
): FinishReason | undefined {
  switch (reason) {
    case 'stop':
      return 'STOP' as FinishReason;
    case 'length':
      return 'MAX_TOKENS' as FinishReason;
    case 'tool_calls':
      return 'STOP' as FinishReason;
    case 'content_filter':
      return 'SAFETY' as FinishReason;
    case null:
    default:
      return undefined;
  }
}

/**
 * Convert OpenAI tools back to Gemini FunctionDeclaration[] for compatibility
 * with tool registry lookups.
 */
export function openaiToolsToGeminiFunctionDeclarations(
  tools: OpenAiTool[],
): FunctionDeclaration[] {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters as FunctionDeclaration['parameters'],
  }));
}
