/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext } from './types.js';
import { MessageType } from '../types.js';

/**
 * `/provider list` — show all registered providers.
 */
const listProvidersCommand: SlashCommand = {
  name: 'list',
  description: 'List all available LLM providers',
  kind: 'built-in' as SlashCommand['kind'],
  action: async (context: CommandContext) => {
    // Get the active provider ID for highlighting
    const config = context.services.agentContext?.config;
    const activeId = config?.getActiveProviderId();

    // Dynamically import the registry to get the actual registered providers
    const { LlmProviderRegistry: Registry } = await import(
      '@google/gemini-cli-core'
    );
    const providers = Registry.getAll();

    if (providers.length === 0) {
      context.ui.addItem({
        type: MessageType.WARNING,
        text: 'No providers registered.',
      });
      return;
    }

    const lines = providers.map((p) => {
      const authInfo = p.authTypes.join(', ');
      const isActive = p.id === activeId;
      return `${isActive ? '→' : ' '} ${p.name} (${p.id})${isActive ? ' [active]' : ''} — auth: ${authInfo}`;
    });

    context.ui.addItem({
      type: MessageType.INFO,
      text: `Available providers:\n${lines.join('\n')}`,
    });
  },
};

/**
 * `/provider current` — show the currently active provider.
 */
const currentProviderCommand: SlashCommand = {
  name: 'current',
  description: 'Show the currently active provider',
  kind: 'built-in' as SlashCommand['kind'],
  action: (context: CommandContext) => {
    const config = context.services.agentContext?.config;
    if (!config) return;

    const providerId = config.getActiveProviderId();
    const model = config.getModel();
    const activeModel = config.getActiveModel();
    const modelInfo =
      model !== activeModel ? `${model} (active: ${activeModel})` : model;

    context.ui.addItem({
      type: MessageType.INFO,
      text: `Current provider: ${providerId}\nModel: ${modelInfo}`,
    });
  },
};

/**
 * `/provider set <id>` — switch to a different provider.
 */
const setProviderCommand: SlashCommand = {
  name: 'set',
  description:
    'Switch to a different provider. Usage: /provider set <provider-id> [api-key]',
  kind: 'built-in' as SlashCommand['kind'],
  action: async (context: CommandContext, args: string) => {
    const parts = args.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      context.ui.addItem({
        type: MessageType.ERROR,
        text: 'Usage: /provider set <provider-id> [api-key]',
      });
      return;
    }

    const providerId = parts[0];
    const apiKey = parts[1]; // Optional — can also come from env vars

    const config = context.services.agentContext?.config;
    if (!config) {
      context.ui.addItem({
        type: MessageType.ERROR,
        text: 'Config not available.',
      });
      return;
    }

    try {
      await config.setProvider(providerId, apiKey);
      context.ui.addItem({
        type: MessageType.INFO,
        text: `Provider switched to: ${providerId}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      context.ui.addItem({
        type: MessageType.ERROR,
        text: `Failed to switch provider: ${message}`,
      });
    }
  },
};

/**
 * `/provider` — manage LLM providers.
 *
 * Subcommands:
 * - `/provider list` — show all registered providers
 * - `/provider current` — show current provider
 * - `/provider set <id> [api-key]` — switch provider
 */
export const providerCommand: SlashCommand = {
  name: 'provider',
  description: 'Manage LLM providers (list, set, current, add)',
  kind: 'built-in' as SlashCommand['kind'],
  action: (context: CommandContext, args: string) => {
    // Default: show current provider info + tip for subcommands
    const config = context.services.agentContext?.config;
    if (config) {
      const providerId = config.getActiveProviderId();
      const model = config.getModel();
      context.ui.addItem({
        type: MessageType.INFO,
        text: `Current provider: ${providerId}\nModel: ${model}\n\nUse /provider list to see all providers, /provider add to add a custom one.`,
      });
    } else {
      context.ui.addItem({
        type: MessageType.INFO,
        text: 'Config not available. Use /provider list to see all providers.',
      });
    }
  },
  subCommands: [
    listProvidersCommand,
    setProviderCommand,
    currentProviderCommand,
    // Add provider wizard
    {
      name: 'add',
      description: 'Add a new provider via interactive wizard',
      kind: 'built-in' as SlashCommand['kind'],
      action: async (context) => {
        const config = context.services.agentContext?.config ?? null;
        const settings = context.services.settings;
        // Import React and the dialog component
        const React = await import('react');
        const { ProviderAddDialog } = await import('../components/ProviderAddDialog.js');

        return {
          type: 'custom_dialog',
          component: React.default.createElement(ProviderAddDialog, {
            config,
            settings,
            onClose: () => context.ui.removeComponent(),
            onSaved: () => context.ui.reloadCommands(),
            uiAddItem: context.ui.addItem,
          }),
        };
      },
    },
  ],
};
