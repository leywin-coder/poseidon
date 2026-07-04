/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LlmProvider, ProviderConfig, ProviderContentGenerator } from './llmProvider.js';
import type { ModelDefinition } from '../services/modelConfigService.js';
import { AuthType } from './contentGenerator.js';
import { LoggingContentGenerator } from './loggingContentGenerator.js';
import type { Config } from '../config/config.js';

/**
 * Google Gemini provider.
 *
 * Wraps the existing content generator creation logic (GoogleGenAI client,
 * CodeAssist, Vertex AI) into the LlmProvider interface. This is a pure
 * refactor — the actual client creation still delegates to the existing
 * createContentGenerator function.
 *
 * The Google provider is the default and supports all existing auth types.
 */
export class GoogleLlmProvider implements LlmProvider {
  readonly id = 'google';
  readonly name = 'Google Gemini';

  /**
   * Getter instead of initializer to avoid circular-module initialization
   * issues: when `googleProvider.ts` is loaded early in a circular chain,
   * `AuthType` from `contentGenerator.ts` may still be `undefined` at
   * class-field initialization time. Using a getter defers the lookup to
   * call time, when all modules are fully initialized.
   */
  get authTypes(): AuthType[] {
    return [
      AuthType.LOGIN_WITH_GOOGLE,
      AuthType.USE_GEMINI,
      AuthType.USE_VERTEX_AI,
      AuthType.LEGACY_CLOUD_SHELL,
      AuthType.COMPUTE_ADC,
      AuthType.GATEWAY,
    ];
  }

  async createClient(config: ProviderConfig): Promise<ProviderContentGenerator> {
    // Lazy import to avoid circular dependencies and keep the Google-specific
    // code path isolated to runtime rather than module-load time.
    const { createContentGenerator, createContentGeneratorConfig } = await import(
      './contentGenerator.js'
    );

    // We need a Config instance to pass to createContentGenerator. This is
    // provided by the caller (see config.ts setProvider method).
    const gcConfig = config._internalConfig as Config | undefined;
    if (!gcConfig) {
      throw new Error(
        'GoogleLlmProvider.createClient requires a Config instance. ' +
          'Use Config.setProvider() instead of calling this directly.',
      );
    }

    const contentGeneratorConfig = await createContentGeneratorConfig(
      gcConfig,
      config.authType,
      config.apiKey,
      config.baseUrl,
      config.customHeaders,
    );

    const generator = await createContentGenerator(
      contentGeneratorConfig,
      gcConfig,
      gcConfig.getSessionId(),
    );

    // Wrap in LoggingContentGenerator for telemetry if not already wrapped.
    if (generator instanceof LoggingContentGenerator) {
      return generator;
    }
    return new LoggingContentGenerator(generator, gcConfig);
  }

  getAvailableModels(): ModelDefinition[] {
    // Google models are defined in defaultModelConfigs.ts and managed by
    // ModelConfigService. Return empty here — the service handles enumeration.
    return [];
  }
}
