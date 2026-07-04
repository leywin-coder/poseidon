/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Ported from the Odysseus UI project (theme.js THEMES object)
// Generates all remaining Odysseus themes as TypeScript files

import { type ColorsTheme, Theme } from '../../theme.js';
import { interpolateColor } from '../../color-utils.js';

function makeTheme(
  name: string,
  displayName: string,
  bg: string,
  fg: string,
  panel: string,
  border: string,
  accent: string,
  cyan: string,
  green: string,
  yellow: string,
  purple: string,
  gradFrom: string,
  gradTo: string,
): Theme {
  const colors: ColorsTheme = {
    type: 'dark',
    Background: bg,
    Foreground: fg,
    LightBlue: cyan,
    AccentBlue: cyan,
    AccentPurple: purple,
    AccentCyan: cyan,
    AccentGreen: green,
    AccentYellow: yellow,
    AccentRed: accent,
    DiffAdded: '#1a2f1a',
    DiffRemoved: '#2f1a1a',
    Comment: interpolateColor(fg, bg, 0.45),
    Gray: interpolateColor(fg, bg, 0.45),
    DarkGray: interpolateColor(fg, bg, 0.7),
    GradientColors: [gradFrom, gradTo],
  };

  return new Theme(
    displayName,
    'dark',
    {
      hljs: { display: 'block', overflowX: 'auto', padding: '0.5em', background: bg, color: fg },
      'hljs-keyword': { color: purple },
      'hljs-literal': { color: cyan },
      'hljs-symbol': { color: cyan },
      'hljs-name': { color: cyan },
      'hljs-link': { color: cyan, textDecoration: 'underline' },
      'hljs-built_in': { color: cyan },
      'hljs-type': { color: yellow },
      'hljs-number': { color: green },
      'hljs-class': { color: yellow },
      'hljs-string': { color: green },
      'hljs-meta-string': { color: green },
      'hljs-regexp': { color: accent },
      'hljs-template-tag': { color: accent },
      'hljs-subst': { color: fg },
      'hljs-function': { color: cyan },
      'hljs-title': { color: cyan, fontWeight: 'bold' },
      'hljs-params': { color: fg },
      'hljs-formula': { color: fg },
      'hljs-comment': { color: interpolateColor(fg, bg, 0.45), fontStyle: 'italic' },
      'hljs-quote': { color: interpolateColor(fg, bg, 0.45), fontStyle: 'italic' },
      'hljs-doctag': { color: interpolateColor(fg, bg, 0.45) },
      'hljs-meta': { color: interpolateColor(fg, bg, 0.55) },
      'hljs-meta-keyword': { color: interpolateColor(fg, bg, 0.55) },
      'hljs-tag': { color: interpolateColor(fg, bg, 0.55) },
      'hljs-variable': { color: purple },
      'hljs-template-variable': { color: purple },
      'hljs-attr': { color: yellow },
      'hljs-attribute': { color: yellow },
      'hljs-builtin-name': { color: cyan },
      'hljs-section': { color: yellow, fontWeight: 'bold' },
      'hljs-emphasis': { fontStyle: 'italic' },
      'hljs-strong': { fontWeight: 'bold' },
      'hljs-bullet': { color: yellow },
      'hljs-selector-tag': { color: accent },
      'hljs-selector-id': { color: yellow },
      'hljs-selector-class': { color: green },
      'hljs-addition': { backgroundColor: '#1a2f1a', display: 'inline-block', width: '100%' },
      'hljs-deletion': { backgroundColor: '#2f1a1a', display: 'inline-block', width: '100%' },
    },
    colors,
  );
}

// claude:    { bg:'#262624', fg:'#f5f4f0', panel:'#30302e', border:'#4a4a47', red:'#c6613f' }
export const OdysseusClaude = makeTheme(
  'claude', 'Odysseus Claude',
  '#262624', '#f5f4f0', '#30302e', '#4a4a47', '#c6613f',
  '#6b9fb8', '#7aab7a', '#c6a84b', '#9b7fc6', '#c6613f', '#6b9fb8',
);

// midnight:  { bg:'#0d1117', fg:'#c9d1d9', panel:'#161b22', border:'#30363d', red:'#f85149' }
export const OdysseusMidnight = makeTheme(
  'midnight', 'Odysseus Midnight',
  '#0d1117', '#c9d1d9', '#161b22', '#30363d', '#f85149',
  '#79c0ff', '#56d364', '#e3b341', '#d2a8ff', '#f85149', '#79c0ff',
);

// paper:     { bg:'#faf8f5', fg:'#3b3836', panel:'#ffffff', border:'#d5d0c8', red:'#c5ac4a' }
export const OdysseusPaper: Theme = new Theme(
  'Odysseus Paper',
  'light',
  {
    hljs: { display: 'block', overflowX: 'auto', padding: '0.5em', background: '#faf8f5', color: '#3b3836' },
    'hljs-keyword': { color: '#7c4daa', fontWeight: 'bold' },
    'hljs-literal': { color: '#1a5c8c' },
    'hljs-symbol': { color: '#1a5c8c' },
    'hljs-name': { color: '#1a5c8c' },
    'hljs-link': { color: '#1a5c8c', textDecoration: 'underline' },
    'hljs-built_in': { color: '#1a5c8c' },
    'hljs-type': { color: '#a06020' },
    'hljs-number': { color: '#1a7c3c' },
    'hljs-class': { color: '#a06020' },
    'hljs-string': { color: '#1a7c3c' },
    'hljs-meta-string': { color: '#1a7c3c' },
    'hljs-regexp': { color: '#c00000' },
    'hljs-template-tag': { color: '#c00000' },
    'hljs-subst': { color: '#3b3836' },
    'hljs-function': { color: '#1a5c8c' },
    'hljs-title': { color: '#1a5c8c', fontWeight: 'bold' },
    'hljs-params': { color: '#3b3836' },
    'hljs-formula': { color: '#3b3836' },
    'hljs-comment': { color: '#888070', fontStyle: 'italic' },
    'hljs-quote': { color: '#888070', fontStyle: 'italic' },
    'hljs-doctag': { color: '#888070' },
    'hljs-meta': { color: '#888070' },
    'hljs-meta-keyword': { color: '#888070' },
    'hljs-tag': { color: '#888070' },
    'hljs-variable': { color: '#7c4daa' },
    'hljs-template-variable': { color: '#7c4daa' },
    'hljs-attr': { color: '#a06020' },
    'hljs-attribute': { color: '#a06020' },
    'hljs-builtin-name': { color: '#1a5c8c' },
    'hljs-section': { color: '#a06020', fontWeight: 'bold' },
    'hljs-emphasis': { fontStyle: 'italic' },
    'hljs-strong': { fontWeight: 'bold' },
    'hljs-bullet': { color: '#a06020' },
    'hljs-selector-tag': { color: '#c00000' },
    'hljs-selector-id': { color: '#a06020' },
    'hljs-selector-class': { color: '#1a7c3c' },
    'hljs-addition': { backgroundColor: '#d4f0d4', display: 'inline-block', width: '100%' },
    'hljs-deletion': { backgroundColor: '#f0d4d4', display: 'inline-block', width: '100%' },
  },
  {
    type: 'light',
    Background: '#faf8f5',
    Foreground: '#3b3836',
    LightBlue: '#1a5c8c',
    AccentBlue: '#1a5c8c',
    AccentPurple: '#7c4daa',
    AccentCyan: '#1a5c8c',
    AccentGreen: '#1a7c3c',
    AccentYellow: '#c5ac4a',
    AccentRed: '#c00000',
    DiffAdded: '#d4f0d4',
    DiffRemoved: '#f0d4d4',
    Comment: '#888070',
    Gray: '#888070',
    DarkGray: '#c0b8a8',
    GradientColors: ['#7c4daa', '#1a5c8c'],
  },
);

// retrowave: { bg:'#1a1a2e', fg:'#e94560', panel:'#16213e', border:'#533483', red:'#e94560' }
export const OdysseusRetrowave = makeTheme(
  'retrowave', 'Odysseus Retrowave',
  '#1a1a2e', '#e94560', '#16213e', '#533483', '#e94560',
  '#00d9ff', '#39ff14', '#f5a623', '#bf00ff', '#e94560', '#bf00ff',
);

// forest:    { bg:'#1b2a1b', fg:'#a8d5a2', panel:'#142414', border:'#3d6b3d', red:'#7cb871' }
export const OdysseusForest = makeTheme(
  'forest', 'Odysseus Forest',
  '#1b2a1b', '#a8d5a2', '#142414', '#3d6b3d', '#7cb871',
  '#4ecdc4', '#7cb871', '#c5a028', '#a8d5a2', '#7cb871', '#4ecdc4',
);

// ocean:     { bg:'#0b1a2c', fg:'#64d2ff', panel:'#091422', border:'#1e5074', red:'#4facfe' }
export const OdysseusOcean = makeTheme(
  'ocean', 'Odysseus Ocean',
  '#0b1a2c', '#64d2ff', '#091422', '#1e5074', '#4facfe',
  '#64d2ff', '#43c6a5', '#f5d547', '#9d71e8', '#4facfe', '#64d2ff',
);

// ume:       { bg:'#2b1b2e', fg:'#f5c2e7', panel:'#1e1420', border:'#6c4675', red:'#f5a0c0' }
export const OdysseusUme = makeTheme(
  'ume', 'Odysseus Ume',
  '#2b1b2e', '#f5c2e7', '#1e1420', '#6c4675', '#f5a0c0',
  '#cba0f5', '#a0f5c8', '#f5e0a0', '#f5a0c0', '#f5a0c0', '#cba0f5',
);

// copper:    { bg:'#1c1410', fg:'#e8c39e', panel:'#140f0a', border:'#7a5533', red:'#d4764e' }
export const OdysseusCopper = makeTheme(
  'copper', 'Odysseus Copper',
  '#1c1410', '#e8c39e', '#140f0a', '#7a5533', '#d4764e',
  '#c8a878', '#98b888', '#d4a84e', '#b87878', '#d4764e', '#c8a878',
);

// terminal:  { bg:'#000000', fg:'#00ff41', panel:'#0a0a0a', border:'#003b00', red:'#00ff41' }
export const OdysseusTerminal = makeTheme(
  'terminal', 'Odysseus Terminal',
  '#000000', '#00ff41', '#0a0a0a', '#003b00', '#00ff41',
  '#00ffcc', '#00ff41', '#aaff00', '#00ff41', '#00ff41', '#00ffcc',
);

// lavender:  { bg:'#f3eef8', fg:'#3d3551', panel:'#faf7ff', border:'#cec3de', red:'#9b6dcc' }
export const OdysseusLavender: Theme = new Theme(
  'Odysseus Lavender',
  'light',
  {
    hljs: { display: 'block', overflowX: 'auto', padding: '0.5em', background: '#f3eef8', color: '#3d3551' },
    'hljs-keyword': { color: '#7c3aaa', fontWeight: 'bold' },
    'hljs-literal': { color: '#3a6aa8' },
    'hljs-symbol': { color: '#3a6aa8' },
    'hljs-name': { color: '#3a6aa8' },
    'hljs-link': { color: '#3a6aa8', textDecoration: 'underline' },
    'hljs-built_in': { color: '#3a6aa8' },
    'hljs-type': { color: '#9b6dcc' },
    'hljs-number': { color: '#3a8a5c' },
    'hljs-class': { color: '#9b6dcc' },
    'hljs-string': { color: '#3a8a5c' },
    'hljs-meta-string': { color: '#3a8a5c' },
    'hljs-regexp': { color: '#cc3a5c' },
    'hljs-template-tag': { color: '#cc3a5c' },
    'hljs-subst': { color: '#3d3551' },
    'hljs-function': { color: '#3a6aa8' },
    'hljs-title': { color: '#7c3aaa', fontWeight: 'bold' },
    'hljs-params': { color: '#3d3551' },
    'hljs-formula': { color: '#3d3551' },
    'hljs-comment': { color: '#9a90b4', fontStyle: 'italic' },
    'hljs-quote': { color: '#9a90b4', fontStyle: 'italic' },
    'hljs-doctag': { color: '#9a90b4' },
    'hljs-meta': { color: '#9a90b4' },
    'hljs-meta-keyword': { color: '#9a90b4' },
    'hljs-tag': { color: '#9a90b4' },
    'hljs-variable': { color: '#7c3aaa' },
    'hljs-template-variable': { color: '#7c3aaa' },
    'hljs-attr': { color: '#9b6dcc' },
    'hljs-attribute': { color: '#9b6dcc' },
    'hljs-builtin-name': { color: '#3a6aa8' },
    'hljs-section': { color: '#9b6dcc', fontWeight: 'bold' },
    'hljs-emphasis': { fontStyle: 'italic' },
    'hljs-strong': { fontWeight: 'bold' },
    'hljs-bullet': { color: '#9b6dcc' },
    'hljs-selector-tag': { color: '#cc3a5c' },
    'hljs-selector-id': { color: '#9b6dcc' },
    'hljs-selector-class': { color: '#3a8a5c' },
    'hljs-addition': { backgroundColor: '#d8f0e0', display: 'inline-block', width: '100%' },
    'hljs-deletion': { backgroundColor: '#f0d8e0', display: 'inline-block', width: '100%' },
  },
  {
    type: 'light',
    Background: '#f3eef8',
    Foreground: '#3d3551',
    LightBlue: '#3a6aa8',
    AccentBlue: '#3a6aa8',
    AccentPurple: '#7c3aaa',
    AccentCyan: '#3a6aa8',
    AccentGreen: '#3a8a5c',
    AccentYellow: '#9b6dcc',
    AccentRed: '#cc3a5c',
    DiffAdded: '#d8f0e0',
    DiffRemoved: '#f0d8e0',
    Comment: '#9a90b4',
    Gray: '#9a90b4',
    DarkGray: '#cec3de',
    GradientColors: ['#7c3aaa', '#3a6aa8'],
  },
);
