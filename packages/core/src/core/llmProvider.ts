/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Content,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentConfig,
  GenerateContentResponse,
} from '@google/genai';
import type { ModelDefinition } from '../services/modelConfigService.js';
import type { AuthType } from './contentGenerator.js';
import type { LlmRole } from '../telemetry/llmRole.js';

/**
 * Configuration for creating a provider client.
 * Extends the base ContentGeneratorConfig with provider-specific fields.
 */
export interface ProviderConfig {
  providerId: string;
  apiKey?: string;
  baseUrl?: string;
  proxy?: string;
  customHeaders?: Record<string, string>;
  authType?: AuthType;
  /** OpenAI-specific: organization ID. */
  organization?: string;
  /** OpenAI-specific: project ID. */
  project?: string;
  /**
   * @internal
   * Internal Config instance passed by Config.setProvider().
   * Not part of the public API — do not set manually.
   */
  _internalConfig?: unknown;
}

/**
 * Interface for generating content, abstracting over provider APIs.
 * This mirrors the existing ContentGenerator interface but is owned by
 * a specific provider implementation.
 */
export interface ProviderContentGenerator {
  generateContent(
    request: ProviderGenerateRequest,
    userPromptId: string,
    role: LlmRole,
  ): Promise<GenerateContentResponse>;

  generateContentStream(
    request: ProviderGenerateRequest,
    userPromptId: string,
    role: LlmRole,
  ): Promise<AsyncGenerator<GenerateContentResponse>>;

  countTokens(request: ProviderCountTokensRequest): Promise<ProviderCountTokensResponse>;

  embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;
}

/**
 * Provider-agnostic generate request.
 * Uses @google/genai types as the canonical interchange format.
 */
export interface ProviderGenerateRequest {
  model: string;
  contents: Content[];
  config?: GenerateContentConfig;
}

/**
 * Provider-agnostic count tokens request.
 */
export interface ProviderCountTokensRequest {
  model: string;
  contents: Content[];
  config?: { abortSignal?: AbortSignal };
}

/**
 * Provider-agnostic count tokens response.
 */
export interface ProviderCountTokensResponse {
  totalTokens?: number;
  cachedContentTokenCount?: number;
}

/**
 * A provider is a pluggable backend for LLM inference.
 *
 * Each provider knows how to:
 * - Create a client from configuration
 * - Enumerate its available models
 * - Translate its native response format into @google/genai types
 *
 * The Google provider is the default and preserves all existing behavior.
 * Additional providers (OpenAI, Anthropic, etc.) implement this interface.
 */
export interface LlmProvider {
  /** Unique identifier, e.g. 'google', 'openai'. */
  readonly id: string;
  /** Human-readable name for display in UI. */
  readonly name: string;
  /** Authentication types this provider supports. */
  readonly authTypes: AuthType[];

  /**
   * Create a content generator client for this provider.
   */
  createClient(config: ProviderConfig): Promise<ProviderContentGenerator>;

  /**
   * Return the models available from this provider.
   */
  getAvailableModels(): ModelDefinition[];

  /**
   * Optional: fetch available models from the provider's API at runtime.
   * Returns model definitions keyed by model ID.
   * Return an empty object if discovery is not supported or fails.
   */
  discoverModels?(baseUrl: string, apiKey?: string): Promise<Record<string, ModelDefinition>>;
}
