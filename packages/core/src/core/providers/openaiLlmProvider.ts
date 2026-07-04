/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  LlmProvider,
  ProviderConfig,
  ProviderContentGenerator,
} from '../llmProvider.js';
import { AuthType } from '../contentGenerator.js';
import type { ModelDefinition } from '../../services/modelConfigService.js';
import { OpenAIContentGenerator } from './openaiContentGenerator.js';

/**
 * OpenAI-compatible LLM provider.
 * Supports any endpoint that implements the OpenAI API (including local models like Ollama).
 *
 * Configuration:
 * - baseUrl: The base URL of the OpenAI-compatible endpoint (e.g., "http://localhost:3001")
 * - apiKey: Optional API key (some local endpoints don't require this)
 */
export class OpenAICompatibleLlmProvider implements LlmProvider {
  readonly id = 'openai-compatible';
  readonly name = 'OpenAI Compatible';

  /** See GoogleLlmProvider.authTypes for the rationale behind using a getter. */
  get authTypes(): AuthType[] {
    return [AuthType.USE_OPENAI];
  }

  private modelCache: Map<string, { models: ModelDefinition[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  async createClient(config: ProviderConfig): Promise<ProviderContentGenerator> {
    if (!config.baseUrl) {
      throw new Error(
        'OpenAI-compatible provider requires baseUrl in config (e.g., "http://localhost:3001")',
      );
    }

    // Validate baseUrl format
    try {
      new URL(config.baseUrl);
    } catch {
      throw new Error(
        `Invalid baseUrl: "${config.baseUrl}". Must be a valid URL (e.g., "http://localhost:3001").`,
      );
    }

    return new OpenAIContentGenerator({
      providerId: config.providerId,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      proxy: config.proxy,
      customHeaders: config.customHeaders,
      organization: config.organization,
      project: config.project,
    });
  }

  getAvailableModels(): ModelDefinition[] {
    // Return an empty array; models are discovered dynamically via discoverModels()
    return [];
  }

  /**
   * Fetch available models from the OpenAI-compatible endpoint.
   */
  async discoverModels(baseUrl: string, apiKey?: string): Promise<Record<string, ModelDefinition>> {
    // Normalize baseUrl: strip trailing /v1 since we always append /v1/...
    const normalizedBase = baseUrl
      ? baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')
      : baseUrl;
    const cacheKey = `${normalizedBase}:${apiKey || 'none'}`;

    // Check cache
    const cached = this.modelCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return Object.fromEntries(
        cached.models.map((m) => [(m as any).id || m.displayName || '', m]),
      );
    }

    try {
      const endpoint = `${normalizedBase}/v1/models`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      interface OpenAIModelsResponse {
        data: Array<{
          id: string;
          object: string;
          created?: number;
          owned_by?: string;
        }>;
      }

      const data: OpenAIModelsResponse = await response.json();

      const models: ModelDefinition[] = (data.data || []).map((model) => ({
        displayName: model.id,
        tier: 'standard',
        family: 'openai-compatible',
        providerId: this.id,
      }));

      const modelsRecord: Record<string, ModelDefinition> = {};
      (data.data || []).forEach((model, i) => {
        modelsRecord[model.id] = models[i];
      });

      // Update cache (keep ModelDefinition[] for backward compat)
      this.modelCache.set(cacheKey, { models, timestamp: Date.now() });

      return modelsRecord;
    } catch (error) {
      console.error(
        `Failed to discover models from ${baseUrl}:`,
        error instanceof Error ? error.message : String(error),
      );
      return {};
    }
  }

  /**
   * Clear model cache for a specific endpoint.
   */
  clearModelCache(baseUrl?: string, apiKey?: string): void {
    if (baseUrl) {
      const cacheKey = `${baseUrl}:${apiKey || 'none'}`;
      this.modelCache.delete(cacheKey);
    } else {
      this.modelCache.clear();
    }
  }
}
