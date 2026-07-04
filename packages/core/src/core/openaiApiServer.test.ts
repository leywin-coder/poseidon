/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import http from 'node:http';
import { createOpenaiApiServer } from './openaiApiServer.js';
import type { ModelConfigService } from '../services/modelConfigService.js';

function fetchJson(
  server: http.Server,
  path: string,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      reject(new Error('Server not listening'));
      return;
    }
    http
      .get(
        `http://localhost:${addr.port}${path}`,
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              status: res.statusCode ?? 500,
              body: JSON.parse(data),
            });
          });
        },
      )
      .on('error', reject);
  });
}

function optionsRequest(
  server: http.Server,
  path: string,
): Promise<{ status: number; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      reject(new Error('Server not listening'));
      return;
    }
    const req = http.request(
      `http://localhost:${addr.port}${path}`,
      { method: 'OPTIONS' },
      (res) => {
        resolve({ status: res.statusCode ?? 500, headers: res.headers });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

describe('createOpenaiApiServer', () => {
  let server: http.Server;

  beforeEach(() => {
    server?.close();
  });

  it('returns 404 for unknown routes', async () => {
    const mockMcs = {
      getModelDefinitions: () => ({}),
    } as unknown as ModelConfigService;

    server = createOpenaiApiServer({
      port: 0,
      modelConfigService: mockMcs,
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));

    const res = await fetchJson(server, '/v1/chat/completions');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('returns health check on GET /', async () => {
    server = createOpenaiApiServer({ port: 0 });
    await new Promise<void>((resolve) => server.listen(0, resolve));

    const res = await fetchJson(server, '/');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });

  it('lists models from ModelConfigService on GET /v1/models', async () => {
    const mockMcs = {
      getModelDefinitions: () => ({
        'gpt-4o': {
          displayName: 'GPT-4o',
          tier: 'pro',
          family: 'gpt-4',
          providerId: 'openai',
          isPreview: false,
          isVisible: true,
          features: {},
        },
        'gemini-2.5-pro': {
          tier: 'pro',
          family: 'gemini-2.5',
          isPreview: false,
          isVisible: true,
          features: {},
        },
        'hidden-model': {
          tier: 'pro',
          isVisible: false,
          features: {},
        },
      }),
    } as unknown as ModelConfigService;

    server = createOpenaiApiServer({
      port: 0,
      modelConfigService: mockMcs,
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));

    const res = await fetchJson(server, '/v1/models');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('object', 'list');
    expect(res.body).toHaveProperty('data');
    const data = (res.body as { data: Array<{ id: string; object: string; created: number; owned_by: string }> }).data;

    // Should have 2 visible models, not the hidden one
    expect(data).toHaveLength(2);

    const gpt4o = data.find((m) => m.id === 'gpt-4o');
    expect(gpt4o).toBeDefined();
    expect(gpt4o).toMatchObject({
      object: 'model',
      owned_by: 'openai',
    });
    expect(gpt4o).toHaveProperty('created');

    const gemini = data.find((m) => m.id === 'gemini-2.5-pro');
    expect(gemini).toBeDefined();
    expect(gemini).toMatchObject({
      object: 'model',
      owned_by: 'google',
    });

    const hidden = data.find((m) => m.id === 'hidden-model');
    expect(hidden).toBeUndefined();
  });

  it('returns 200 with empty data when no model config service', async () => {
    server = createOpenaiApiServer({ port: 0 });
    await new Promise<void>((resolve) => server.listen(0, resolve));

    const res = await fetchJson(server, '/v1/models');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ object: 'list', data: [] });
  });

  it('responds to OPTIONS with CORS headers', async () => {
    server = createOpenaiApiServer({ port: 0 });
    await new Promise<void>((resolve) => server.listen(0, resolve));

    const res = await optionsRequest(server, '/v1/models');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toBe(
      'GET, POST, OPTIONS',
    );
    expect(res.headers['access-control-allow-headers']).toBe(
      'Content-Type, Authorization',
    );
  });
});
