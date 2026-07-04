/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LlmProvider } from './llmProvider.js';

/**
 * Registry for LLM provider implementations.
 *
 * Providers register themselves at module load time (or via extension).
 * The registry is a simple static map — no DI overhead, easy to test.
 *
 * @example
 * ```ts
 * // Register a provider
 * LlmProviderRegistry.register(new OpenAILlmProvider());
 *
 * // Look up a provider
 * const provider = LlmProviderRegistry.get('openai');
 * ```
 */
export class LlmProviderRegistry {
  private static readonly providers = new Map<string, LlmProvider>();

  /**
   * Register a provider. If a provider with the same ID is already registered,
   * it will be overwritten (last-write-wins).
   */
  static register(provider: LlmProvider): void {
    LlmProviderRegistry.providers.set(provider.id, provider);
  }

  /**
   * Get a provider by ID. Returns undefined if not found.
   */
  static get(providerId: string): LlmProvider | undefined {
    return LlmProviderRegistry.providers.get(providerId);
  }

  /**
   * Check if a provider is registered.
   */
  static has(providerId: string): boolean {
    return LlmProviderRegistry.providers.has(providerId);
  }

  /**
   * Get all registered providers.
   */
  static getAll(): LlmProvider[] {
    return Array.from(LlmProviderRegistry.providers.values());
  }

  /**
   * Get a provider by ID, falling back to the Google provider if not found.
   * Throws if the Google provider is not registered.
   */
  static getByIdOrDefault(providerId?: string): LlmProvider {
    if (providerId) {
      const provider = LlmProviderRegistry.get(providerId);
      if (provider) return provider;
    }
    const google = LlmProviderRegistry.get('google');
    if (!google) {
      throw new Error(
        'Google provider is not registered. Ensure providers are initialized.',
      );
    }
    return google;
  }
}
