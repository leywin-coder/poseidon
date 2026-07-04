/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { Box } from 'ink';
import { AskUserDialog } from './AskUserDialog.js';
import { LoadedSettings } from '../../config/settings.js';
import type { Config } from '@google/gemini-cli-core';
import { MessageType } from '../types.js';
import { KeychainService, QuestionType } from '@google/gemini-cli-core';
import { saveModelChange, saveActiveProvider } from '../../config/settings.js';

interface ProviderAddDialogProps {
  config: Config | null;
  settings: LoadedSettings;
  onClose: () => void;
  onSaved?: () => void;
  uiAddItem: (item: any) => void;
}

function sanitizeAccount(s: string) {
  return s.replace(/[^a-zA-Z0-9-_.]/g, '_');
}

export const ProviderAddDialog: React.FC<ProviderAddDialogProps> = ({
  config,
  settings,
  onClose,
  onSaved,
  uiAddItem,
}) => {
  const [stage, setStage] = useState<'collect' | 'choose' | 'done'>('collect');
  const [providerNameState, setProviderNameState] = useState('');
  const [baseUrlState, setBaseUrlState] = useState('');
  const [apiKeyState, setApiKeyState] = useState('');
  const [models, setModels] = useState<Array<{ id: string; description?: string }>>([]);

  const collectQuestions = [
    {
      type: QuestionType.TEXT,
      header: 'Provider Name',
      question: 'Enter a name for this provider (e.g., local, remote, my-model)',
      placeholder: 'local',
    },
    {
      type: QuestionType.TEXT,
      header: 'Base URL',
      question: 'Enter the OpenAI-compatible base URL (e.g., http://localhost:3001/v1)',
      placeholder: 'http://localhost:3001/v1',
    },
    {
      type: QuestionType.TEXT,
      header: 'API Key',
      question: 'Enter the API key (leave blank if none)',
      placeholder: 'sk-...',
    },
  ];

  const handleCollectSubmit = useCallback(
    async (answers: { [k: string]: string }) => {
      const providerName = (answers[0] || 'local').trim() || 'local';
      const baseUrl = (answers[1] || '').trim();
      const apiKey = (answers[2] || '').trim();

      try {
        new URL(baseUrl);
      } catch (e) {
        uiAddItem({ type: MessageType.ERROR, text: 'Invalid base URL.' });
        return onClose();
      }

      setProviderNameState(providerName);
      setBaseUrlState(baseUrl);
      setApiKeyState(apiKey);

      // Attempt discovery
      setModels([]);

      const normalized = baseUrl.replace(/\/+$/, '');
      // If baseUrl already contains /v1, don't double it up
      const hasV1 = normalized.endsWith('/v1');
      const baseForDiscovery = hasV1 ? normalized.slice(0, -3).replace(/\/+$/, '') : normalized;
      const candidates = [
        `${normalized}/v1/models`,
        `${normalized}/models`,
        `${baseForDiscovery}/models`,
      ];

      let found: Array<{ id: string; description?: string }> = [];

      for (const url of candidates) {
        try {
          const headers: Record<string, string> = { Accept: 'application/json' };
          if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
          const res = await fetch(url, { headers, method: 'GET' });
          if (!res.ok) {
            // try next
            continue;
          }
          const data = await res.json();
          // Normalize common shapes
          const list = data?.data ?? data?.models ?? data?.model ?? null;
          if (Array.isArray(list)) {
            found = list
              .map((m: any) => ({ id: m.id || m.model || m.name, description: m.description || '' }))
              .filter((x: any) => x.id)
              .map((x: any) => ({ id: String(x.id), description: String(x.description || '') }));
            if (found.length > 0) break;
          }

          // Some servers return { models: { <id>: {...} } }
          if (data && typeof data === 'object') {
            const modelsObj = data.models ?? data.data;
            if (modelsObj && typeof modelsObj === 'object' && !Array.isArray(modelsObj)) {
              found = Object.keys(modelsObj).map((k) => ({
                id: k,
                description: (modelsObj[k] && modelsObj[k].description) || '',
              }));
              if (found.length > 0) break;
            }
          }
        } catch (err) {
          // ignore and try next
        }
      }

      setModels(found);
      setStage('choose');
    },
    [onClose, uiAddItem],
  );

  const handleChooseSubmit = useCallback(
    async (answers: { [k: string]: string }) => {
      // answers may be either a choice index answer or a text answer depending on question type
      let modelAnswer = (answers[0] || '').trim();

      // If no valid model was selected (dialog closed prematurely / type-to-jump accident),
      // default to "auto" so the endpoint handles routing
      if (!modelAnswer || modelAnswer === providerNameState.trim()) {
        modelAnswer = 'auto';
      }

      const selectedModel = modelAnswer;

      // Persist configuration via config service
      try {
        // Store API key securely in OS keychain (best-effort)
        if (apiKeyState) {
          try {
            const kc = new KeychainService('gemini-cli');
            const account = `openai-compatible:${sanitizeAccount(baseUrlState)}`;
            await kc.setPassword(account, apiKeyState);
          } catch (e) {
            uiAddItem({ type: MessageType.WARNING, text: 'Failed to save API key to OS keychain.' });
          }
        }

        // Set provider in runtime config, passing baseUrl explicitly
        // This also activates it as the current provider
        if (config) {
          const providerId = 'openai-compatible';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (config as any).setProvider(providerId, apiKeyState || undefined, baseUrlState);

          // Persist the selected model so /model and chat use it
          config.setModel(selectedModel, false);
        }

        // Also persist via settings file (ensure durability across restarts)
        try {
          saveModelChange(settings, selectedModel);
          saveActiveProvider(
            settings,
            providerNameState,
            baseUrlState,
            selectedModel,
            apiKeyState || undefined,
          );
        } catch (e) {
          // Non-fatal — config.setModel already persists via onModelChange
        }

        uiAddItem({ 
          type: MessageType.INFO, 
          text: `Saved and activated provider "${providerNameState}": ${baseUrlState}\nDefault model: ${selectedModel}\n\nUse /provider current to verify, or just start chatting!` 
        });
        onSaved?.();
      } catch (error) {
        uiAddItem({ type: MessageType.ERROR, text: `Failed to save provider configuration: ${error instanceof Error ? error.message : String(error)}` });
      } finally {
        setStage('done');
        onClose();
      }
    },
    [apiKeyState, baseUrlState, providerNameState, onClose, onSaved, config, uiAddItem],
  );

  if (stage === 'collect') {
    return (
      <Box>
        <AskUserDialog
          questions={collectQuestions}
          width={80}
          onSubmit={handleCollectSubmit}
          onCancel={onClose}
        />
      </Box>
    );
  }

  if (stage === 'choose') {
    // If discovery provided models, show choice; otherwise show text input to enter manually
    if (models.length > 0) {
        const choiceQuestion = [
        {
          type: QuestionType.CHOICE,
          header: 'Default Model',
          question: 'Select a default model (use Other to type a custom model id)',
          options: models.map((m) => ({ label: m.id, description: m.description || '' })),
          multiSelect: false,
          placeholder: 'Enter custom model id',
        },
      ];

      return (
        <Box>
          <AskUserDialog
            questions={choiceQuestion}
            width={80}
            onSubmit={handleChooseSubmit}
            onCancel={onClose}
          />
        </Box>
      );
    }

    const manualQuestion = [
      {
        type: QuestionType.TEXT,
        header: 'Default Model',
        question: 'Enter a default model id (e.g., gpt-4o-mini)',
        placeholder: 'model-id',
      },
    ];

    return (
      <Box>
        <AskUserDialog
          questions={manualQuestion}
          width={80}
          onSubmit={handleChooseSubmit}
          onCancel={onClose}
        />
      </Box>
    );
  }

  return null;
};
