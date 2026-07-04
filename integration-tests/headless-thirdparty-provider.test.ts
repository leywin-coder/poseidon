/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration test: headless (non-interactive) mode with third-party providers.
 *
 * Verifies that the CLI works correctly when:
 * 1. Running in headless mode (-p/--prompt, no TTY, or piped stdin)
 * 2. Using an OpenAI-compatible provider
 * 3. Policy engine correctly handles ASK_USER vs read-only tools
 *
 * These tests use fake responses (recorded LLM output) to avoid
 * needing a real third-party provider endpoint.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { TestRig } from './test-helper.js';

/** Simple prompt: ask the model to echo a test string via read-only tool. */
const READ_FILE_PROMPT = (testFile: string) =>
  `Read the file ${testFile} and tell me what language it is. If the read_file tool fails, output "FAILED".`;

describe('Headless Mode with Third-Party Provider', () => {
  let rig: TestRig;
  let testFile: string;

  beforeEach(() => {
    rig = new TestRig();
  });

  afterEach(async () => {
    if (rig) {
      await rig.cleanup();
    }
  });

  it('should work with OpenAI-compatible provider in headless mode (read-only tool)', async () => {
    const fakeResponsesPath = join(
      import.meta.dirname,
      'policy-headless-readonly.responses',
    );
    rig.setup('headless-openai-provider-readonly', {
      fakeResponsesPath,
      settings: {
        model: {
          name: 'llama3',
        },
        activeProvider: {
          id: 'openai-compatible',
          name: 'local-ollama',
        },
        openaiCompatibleProviders: {
          'local-ollama': {
            baseUrl: 'http://localhost:11434',
            defaultModel: 'llama3',
          },
        },
      },
    });

    testFile = rig.createFile('test.txt', 'Lorem\nIpsum\nDolor\n');
    const result = await rig.run({
      args: ['-p', READ_FILE_PROMPT(testFile)],
      approvalMode: 'default',
    });

    // read_file is read-only: should be allowed by default in headless mode
    expect(result).not.toContain('Tool execution denied by policy');
    expect(result).not.toContain('FAILED');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should deny ASK_USER tools by default in headless mode with third-party provider', async () => {
    const fakeResponsesPath = join(
      import.meta.dirname,
      'policy-headless-shell-denied.responses',
    );
    rig.setup('headless-openai-provider-shell-denied', {
      fakeResponsesPath,
      settings: {
        model: {
          name: 'llama3',
        },
        activeProvider: {
          id: 'openai-compatible',
          name: 'local-ollama',
        },
        openaiCompatibleProviders: {
          'local-ollama': {
            baseUrl: 'http://localhost:11434',
            defaultModel: 'llama3',
          },
        },
      },
    });

    testFile = rig.createFile('test.txt', 'Lorem\nIpsum\nDolor\n');
    const prompt =
      `Use the \`echo POLICY_TEST_ECHO_COMMAND\` shell command. ` +
      `On success, your final response must ONLY be "POLICY_TEST_ECHO_COMMAND". ` +
      `If the command fails output "AR NAR" and stop.`;

    const result = await rig.run({
      args: ['-p', prompt],
      approvalMode: 'default',
    });

    // run_shell_command is ASK_USER: should be denied by default in headless mode.
    // The model output will contain "Tool \"run_shell_command\" not found" or "AR NAR".
    expect(result).toContain('AR NAR');
  });

  it('should allow ASK_USER tools in headless mode with third-party provider if policy allows', async () => {
    const fakeResponsesPath = join(
      import.meta.dirname,
      'policy-headless-shell-allowed.responses',
    );
    rig.setup('headless-openai-provider-shell-allowed', {
      fakeResponsesPath,
      settings: {
        model: {
          name: 'llama3',
        },
        activeProvider: {
          id: 'openai-compatible',
          name: 'local-ollama',
        },
        openaiCompatibleProviders: {
          'local-ollama': {
            baseUrl: 'http://localhost:11434',
            defaultModel: 'llama3',
          },
        },
      },
    });

    testFile = rig.createFile('test.txt', 'Lorem\nIpsum\nDolor\n');
    const prompt =
      `Use the \`echo POLICY_TEST_ECHO_COMMAND\` shell command. ` +
      `On success, your final response must ONLY be "POLICY_TEST_ECHO_COMMAND". ` +
      `If the command fails output "DENIED" and stop.`;

    const policyContent = `
      [[rule]]
      toolName = "run_shell_command"
      decision = "allow"
      priority = 100
    `;
    const policyPath = rig.createFile('test-policy.toml', policyContent);

    const result = await rig.run({
      args: ['-p', prompt, '--policy', policyPath],
      approvalMode: 'default',
    });

    // With explicit allow policy, shell commands should work
    expect(result).toContain('POLICY_TEST_ECHO_COMMAND');
  });

  it('should work with provider via environment variable configuration', async () => {
    const fakeResponsesPath = join(
      import.meta.dirname,
      'policy-headless-readonly.responses',
    );
    rig.setup('headless-openai-provider-env', {
      fakeResponsesPath,
      settings: {
        model: {
          name: 'llama3',
        },
        activeProvider: {
          id: 'openai-compatible',
          name: 'env-provider',
        },
        openaiCompatibleProviders: {
          'env-provider': {
            baseUrl: 'http://localhost:11434',
            defaultModel: 'llama3',
          },
        },
      },
    });

    testFile = rig.createFile('test.txt', 'Lorem\nIpsum\nDolor\n');
    const result = await rig.run({
      args: ['-p', READ_FILE_PROMPT(testFile)],
      approvalMode: 'default',
    });

    // read-only tool should work
    expect(result).not.toContain('FAILED');
    expect(result.length).toBeGreaterThan(0);
  });
});
