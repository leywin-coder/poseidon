/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from '../../theme.js';
import { interpolateColor } from '../../color-utils.js';

// Ported from the Odysseus UI project (OpenHarness "cyberpunk" theme)
const odysseusCyberpunkColors: ColorsTheme = {
  type: 'dark',
  Background: '#0d0d0d',
  Foreground: '#00ff41',
  LightBlue: '#00ffff',
  AccentBlue: '#00ffff',
  AccentPurple: '#bf00ff',
  AccentCyan: '#00ffff',
  AccentGreen: '#00ff41',
  AccentYellow: '#ffff00',
  AccentRed: '#ff0054',
  DiffAdded: '#003310',
  DiffRemoved: '#330010',
  Comment: '#1a1a2e',
  Gray: '#555555',
  DarkGray: interpolateColor('#1a1a2e', '#0d0d0d', 0.5),
  GradientColors: ['#00ff41', '#bf00ff'],
};

export const OdysseusCyberpunk: Theme = new Theme(
  'Odysseus Cyberpunk',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: odysseusCyberpunkColors.Background,
      color: odysseusCyberpunkColors.Foreground,
    },
    'hljs-keyword': {
      color: odysseusCyberpunkColors.AccentPurple,
      fontWeight: 'bold',
    },
    'hljs-literal': {
      color: odysseusCyberpunkColors.AccentCyan,
    },
    'hljs-symbol': {
      color: odysseusCyberpunkColors.AccentCyan,
    },
    'hljs-name': {
      color: odysseusCyberpunkColors.AccentCyan,
    },
    'hljs-link': {
      color: odysseusCyberpunkColors.AccentCyan,
      textDecoration: 'underline',
    },
    'hljs-built_in': {
      color: odysseusCyberpunkColors.AccentCyan,
    },
    'hljs-type': {
      color: odysseusCyberpunkColors.AccentPurple,
    },
    'hljs-number': {
      color: odysseusCyberpunkColors.AccentGreen,
    },
    'hljs-class': {
      color: odysseusCyberpunkColors.AccentGreen,
    },
    'hljs-string': {
      color: odysseusCyberpunkColors.AccentYellow,
    },
    'hljs-meta-string': {
      color: odysseusCyberpunkColors.AccentYellow,
    },
    'hljs-regexp': {
      color: odysseusCyberpunkColors.AccentRed,
    },
    'hljs-template-tag': {
      color: odysseusCyberpunkColors.AccentRed,
    },
    'hljs-subst': {
      color: odysseusCyberpunkColors.Foreground,
    },
    'hljs-function': {
      color: odysseusCyberpunkColors.AccentGreen,
    },
    'hljs-title': {
      color: odysseusCyberpunkColors.AccentCyan,
      fontWeight: 'bold',
    },
    'hljs-params': {
      color: odysseusCyberpunkColors.Foreground,
    },
    'hljs-formula': {
      color: odysseusCyberpunkColors.Foreground,
    },
    'hljs-comment': {
      color: '#33aa55',
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: '#33aa55',
      fontStyle: 'italic',
    },
    'hljs-doctag': {
      color: '#33aa55',
    },
    'hljs-meta': {
      color: odysseusCyberpunkColors.Gray,
    },
    'hljs-meta-keyword': {
      color: odysseusCyberpunkColors.Gray,
    },
    'hljs-tag': {
      color: odysseusCyberpunkColors.Gray,
    },
    'hljs-variable': {
      color: odysseusCyberpunkColors.AccentPurple,
    },
    'hljs-template-variable': {
      color: odysseusCyberpunkColors.AccentPurple,
    },
    'hljs-attr': {
      color: odysseusCyberpunkColors.AccentCyan,
    },
    'hljs-attribute': {
      color: odysseusCyberpunkColors.AccentCyan,
    },
    'hljs-builtin-name': {
      color: odysseusCyberpunkColors.AccentCyan,
    },
    'hljs-section': {
      color: odysseusCyberpunkColors.AccentYellow,
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-bullet': {
      color: odysseusCyberpunkColors.AccentGreen,
    },
    'hljs-selector-tag': {
      color: odysseusCyberpunkColors.AccentRed,
    },
    'hljs-selector-id': {
      color: odysseusCyberpunkColors.AccentYellow,
    },
    'hljs-selector-class': {
      color: odysseusCyberpunkColors.AccentGreen,
    },
    'hljs-addition': {
      backgroundColor: '#003310',
      display: 'inline-block',
      width: '100%',
    },
    'hljs-deletion': {
      backgroundColor: '#330010',
      display: 'inline-block',
      width: '100%',
    },
  },
  odysseusCyberpunkColors,
);
