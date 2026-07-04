/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from '../../theme.js';
import { interpolateColor } from '../../color-utils.js';

// Ported from the Odysseus UI project (OpenHarness "dark" theme)
const odysseusDarkColors: ColorsTheme = {
  type: 'dark',
  Background: '#1a1b26',
  Foreground: '#c0caf5',
  LightBlue: '#7aa2f7',
  AccentBlue: '#7aa2f7',
  AccentPurple: '#bb9af7',
  AccentCyan: '#7dcfff',
  AccentGreen: '#9ece6a',
  AccentYellow: '#e0af68',
  AccentRed: '#f7768e',
  DiffAdded: '#1a2f1a',
  DiffRemoved: '#2f1a1a',
  Comment: '#565f89',
  Gray: '#565f89',
  DarkGray: interpolateColor('#565f89', '#1a1b26', 0.5),
  GradientColors: ['#bb9af7', '#7aa2f7'],
};

export const OdysseusDark: Theme = new Theme(
  'Odysseus Dark',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: odysseusDarkColors.Background,
      color: odysseusDarkColors.Foreground,
    },
    'hljs-keyword': {
      color: odysseusDarkColors.AccentPurple,
    },
    'hljs-literal': {
      color: odysseusDarkColors.AccentBlue,
    },
    'hljs-symbol': {
      color: odysseusDarkColors.AccentBlue,
    },
    'hljs-name': {
      color: odysseusDarkColors.AccentCyan,
    },
    'hljs-link': {
      color: odysseusDarkColors.AccentBlue,
      textDecoration: 'underline',
    },
    'hljs-built_in': {
      color: odysseusDarkColors.AccentCyan,
    },
    'hljs-type': {
      color: odysseusDarkColors.AccentCyan,
    },
    'hljs-number': {
      color: odysseusDarkColors.AccentGreen,
    },
    'hljs-class': {
      color: odysseusDarkColors.AccentGreen,
    },
    'hljs-string': {
      color: odysseusDarkColors.AccentYellow,
    },
    'hljs-meta-string': {
      color: odysseusDarkColors.AccentYellow,
    },
    'hljs-regexp': {
      color: odysseusDarkColors.AccentRed,
    },
    'hljs-template-tag': {
      color: odysseusDarkColors.AccentRed,
    },
    'hljs-subst': {
      color: odysseusDarkColors.Foreground,
    },
    'hljs-function': {
      color: odysseusDarkColors.Foreground,
    },
    'hljs-title': {
      color: odysseusDarkColors.AccentBlue,
      fontWeight: 'bold',
    },
    'hljs-params': {
      color: odysseusDarkColors.Foreground,
    },
    'hljs-formula': {
      color: odysseusDarkColors.Foreground,
    },
    'hljs-comment': {
      color: odysseusDarkColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: odysseusDarkColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-doctag': {
      color: odysseusDarkColors.Comment,
    },
    'hljs-meta': {
      color: odysseusDarkColors.Gray,
    },
    'hljs-meta-keyword': {
      color: odysseusDarkColors.Gray,
    },
    'hljs-tag': {
      color: odysseusDarkColors.Gray,
    },
    'hljs-variable': {
      color: odysseusDarkColors.AccentPurple,
    },
    'hljs-template-variable': {
      color: odysseusDarkColors.AccentPurple,
    },
    'hljs-attr': {
      color: odysseusDarkColors.AccentCyan,
    },
    'hljs-attribute': {
      color: odysseusDarkColors.AccentCyan,
    },
    'hljs-builtin-name': {
      color: odysseusDarkColors.AccentCyan,
    },
    'hljs-section': {
      color: odysseusDarkColors.AccentYellow,
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-bullet': {
      color: odysseusDarkColors.AccentYellow,
    },
    'hljs-selector-tag': {
      color: odysseusDarkColors.AccentRed,
    },
    'hljs-selector-id': {
      color: odysseusDarkColors.AccentYellow,
    },
    'hljs-selector-class': {
      color: odysseusDarkColors.AccentGreen,
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
  odysseusDarkColors,
);
