#!/usr/bin/env node
// Runs the CLI with a hard 15s timeout, then dumps what's pending
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers';

const child = spawn(
  process.execPath,
  ['/home/leywin/gemini-cli/packages/cli/dist/index.js', '-p', 'hey'],
  { stdio: ['inherit', 'inherit', 'inherit'] }
);

const timer = setTimeout(() => {
  process.stderr.write('\n[WATCHDOG] 15s timeout — killing child\n');
  child.kill('SIGKILL');
}, 15_000);

child.on('exit', (code) => {
  clearTimeout(timer);
  process.stderr.write(`[WATCHDOG] child exited with code ${code}\n`);
  process.exit(code ?? 0);
});
