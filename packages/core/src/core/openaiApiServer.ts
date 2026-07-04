/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'node:http';
import type { ModelConfigService } from '../services/modelConfigService.js';

/**
 * Configuration for the OpenAI-compatible API server.
 */
export interface OpenaiApiServerConfig {
  /** Port to listen on. */
  port: number;
  /** Host to bind to (default: 'localhost'). */
  host?: string;
  /** ModelConfigService to enumerate available models. */
  modelConfigService?: ModelConfigService;
}

interface OpenaiModel {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

function setCorsHeaders(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  data: unknown,
): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function handleListModels(
  res: http.ServerResponse,
  modelConfigService?: ModelConfigService,
): void {
  const models: OpenaiModel[] = [];

  if (modelConfigService) {
    const definitions = modelConfigService.getModelDefinitions();
    const now = Math.floor(Date.now() / 1000);

    for (const [modelId, definition] of Object.entries(definitions)) {
      if (definition.isVisible === false) continue;
      models.push({
        id: modelId,
        object: 'model',
        created: now,
        owned_by: definition.providerId ?? 'google',
      });
    }
  }

  sendJson(res, 200, {
    object: 'list',
    data: models,
  });
}

function handleHealthCheck(res: http.ServerResponse): void {
  sendJson(res, 200, { status: 'ok', service: 'gemini-cli-openai-api' });
}

/**
 * Create an HTTP server exposing OpenAI-compatible API endpoints.
 *
 * Currently supported routes:
 * - `GET /v1/models` — list available models
 * - `GET /` — health check
 *
 * The server is returned but not started. Call `.listen()` on it.
 *
 * @example
 * ```ts
 * const server = createOpenaiApiServer({ port: 8080, modelConfigService });
 * server.listen(8080, 'localhost', () => {
 *   console.log('OpenAI API server listening on http://localhost:8080');
 * });
 * ```
 */
export function createOpenaiApiServer(
  config: OpenaiApiServerConfig,
): http.Server {
  const host = config.host ?? 'localhost';

  const server = http.createServer((req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(
      req.url ?? '/',
      `http://${req.headers.host ?? host}`,
    );

    try {
      if (req.method === 'GET' && url.pathname === '/v1/models') {
        return handleListModels(res, config.modelConfigService);
      }
      if (req.method === 'GET' && url.pathname === '/') {
        return handleHealthCheck(res);
      }
      sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  });

  return server;
}
