/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  LlmProvider,
  ProviderConfig,
  ProviderContentGenerator,
} from './llmProvider.js';
import type { ModelDefinition } from '../services/modelConfigService.js';
import { AuthType } from './contentGenerator.js';
import { OpenAIContentGenerator } from './openaiContentGenerator.js';

/**
 * OpenAI provider — implements LlmProvider for OpenAI's GPT models.
 *
 * Supports GPT-4o, GPT-4o-mini, GPT-4-turbo, and O1 models.
 * Requires the 'openai' npm package to be installed.
 *
 * Usage:
 * ```ts
 * LlmProviderRegistry.register(new OpenAILlmProvider());
 * // Then switch to it via: /provider set openai
 * ```
 */
export class OpenAILlmProvider implements LlmProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';

  /** See GoogleLlmProvider.authTypes for the rationale behind using a getter. */
  get authTypes(): AuthType[] {
    return [AuthType.USE_OPENAI];
  }

  async createClient(config: ProviderConfig): Promise<ProviderContentGenerator> {
    if (!config.apiKey) {
      throw new Error(
        'OpenAI provider requires an API key. ' +
          'Set OPENAI_API_KEY environment variable or pass it via /provider set openai <key>',
      );
    }

    return new OpenAIContentGenerator({
      model: 'gpt-4o',
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      organization: config.organization,
      project: config.project,
    });
  }

  getAvailableModels(): ModelDefinition[] {
    return [
      {
        displayName: 'GPT-4o',
        tier: 'pro',
        family: 'gpt-4',
        isPreview: false,
        isVisible: true,
        dialogDescription:
          'Most capable OpenAI model, great for complex tasks requiring reasoning and multimodal understanding.',
        features: { thinking: false, multimodalToolUse: true },
      },
      {
        displayName: 'GPT-4o Mini',
        tier: 'flash',
        family: 'gpt-4',
        isPreview: false,
        isVisible: true,
        dialogDescription:
          'Fast and affordable GPT-4o variant, good for most everyday tasks.',
        features: { thinking: false, multimodalToolUse: true },
      },
      {
        displayName: 'GPT-4 Turbo',
        tier: 'pro',
        family: 'gpt-4',
        isPreview: false,
        isVisible: true,
        dialogDescription:
          'Previous generation GPT-4 with large context window.',
        features: { thinking: false, multimodalToolUse: true },
      },
      {
        displayName: 'O1 Preview',
        tier: 'pro',
        family: 'o1',
        isPreview: true,
        isVisible: true,
        dialogDescription:
          'OpenAI reasoning model for complex math, science, and coding.',
        features: { thinking: true, multimodalToolUse: false },
      },
      {
        displayName: 'O1 Mini',
        tier: 'pro',
        family: 'o1',
        isPreview: true,
        isVisible: true,
        dialogDescription:
          'Faster O1 variant, good for coding and math tasks.',
        features: { thinking: true, multimodalToolUse: false },
      },
    ];
  }
}
