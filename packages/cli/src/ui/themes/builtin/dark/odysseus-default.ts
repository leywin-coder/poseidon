/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from '../../theme.js';
import { interpolateColor } from '../../color-utils.js';

// Ported from the Odysseus UI project (OpenHarness "default" theme)
const odysseusDefaultColors: ColorsTheme = {
  type: 'dark',
  Background: '#282c34',
  Foreground: '#abb2bf',
  LightBlue: '#4a9eff',
  AccentBlue: '#5875d4',
  AccentPurple: '#c678dd',
  AccentCyan: '#61afef',
  AccentGreen: '#98c379',
  AccentYellow: '#e5c07b',
  AccentRed: '#e06c75',
  DiffAdded: '#1a2f1a',
  DiffRemoved: '#2f1a1a',
  Comment: '#5c6370',
  Gray: '#5c6370',
  DarkGray: interpolateColor('#5c6370', '#282c34', 0.5),
  GradientColors: ['#5875d4', '#4a9eff'],
};

export const OdysseusDefault: Theme = new Theme(
  'Odysseus Default',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: odysseusDefaultColors.Background,
      color: odysseusDefaultColors.Foreground,
    },
    'hljs-keyword': {
      color: odysseusDefaultColors.AccentPurple,
    },
    'hljs-literal': {
      color: odysseusDefaultColors.AccentBlue,
    },
    'hljs-symbol': {
      color: odysseusDefaultColors.AccentBlue,
    },
    'hljs-name': {
      color: odysseusDefaultColors.AccentCyan,
    },
    'hljs-link': {
      color: odysseusDefaultColors.AccentBlue,
      textDecoration: 'underline',
    },
    'hljs-built_in': {
      color: odysseusDefaultColors.AccentCyan,
    },
    'hljs-type': {
      color: odysseusDefaultColors.AccentCyan,
    },
    'hljs-number': {
      color: odysseusDefaultColors.AccentGreen,
    },
    'hljs-class': {
      color: odysseusDefaultColors.AccentGreen,
    },
    'hljs-string': {
      color: odysseusDefaultColors.AccentYellow,
    },
    'hljs-meta-string': {
      color: odysseusDefaultColors.AccentYellow,
    },
    'hljs-regexp': {
      color: odysseusDefaultColors.AccentRed,
    },
    'hljs-template-tag': {
      color: odysseusDefaultColors.AccentRed,
    },
    'hljs-subst': {
      color: odysseusDefaultColors.Foreground,
    },
    'hljs-function': {
      color: odysseusDefaultColors.AccentCyan,
    },
    'hljs-title': {
      color: odysseusDefaultColors.AccentBlue,
      fontWeight: 'bold',
    },
    'hljs-params': {
      color: odysseusDefaultColors.Foreground,
    },
    'hljs-formula': {
      color: odysseusDefaultColors.Foreground,
    },
    'hljs-comment': {
      color: odysseusDefaultColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: odysseusDefaultColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-doctag': {
      color: odysseusDefaultColors.Comment,
    },
    'hljs-meta': {
      color: odysseusDefaultColors.Gray,
    },
    'hljs-meta-keyword': {
      color: odysseusDefaultColors.Gray,
    },
    'hljs-tag': {
      color: odysseusDefaultColors.Gray,
    },
    'hljs-variable': {
      color: odysseusDefaultColors.AccentPurple,
    },
    'hljs-template-variable': {
      color: odysseusDefaultColors.AccentPurple,
    },
    'hljs-attr': {
      color: odysseusDefaultColors.AccentCyan,
    },
    'hljs-attribute': {
      color: odysseusDefaultColors.AccentCyan,
    },
    'hljs-builtin-name': {
      color: odysseusDefaultColors.AccentCyan,
    },
    'hljs-section': {
      color: odysseusDefaultColors.AccentYellow,
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-bullet': {
      color: odysseusDefaultColors.AccentYellow,
    },
    'hljs-selector-tag': {
      color: odysseusDefaultColors.AccentRed,
    },
    'hljs-selector-id': {
      color: odysseusDefaultColors.AccentYellow,
    },
    'hljs-selector-class': {
      color: odysseusDefaultColors.AccentGreen,
    },
    'hljs-addition': {
      backgroundColor: '#1a2f1a',
      display: 'inline-block',
      width: '100%',
    },
    'hljs-deletion': {
      backgroundColor: '#2f1a1a',
      display: 'inline-block',
      width: '100%',
    },
  },
  odysseusDefaultColors,
);
