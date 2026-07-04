/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from '../../theme.js';
import { interpolateColor } from '../../color-utils.js';

// Ported from the Odysseus UI project (OpenHarness "solarized" theme)
const odysseusSolarizedColors: ColorsTheme = {
  type: 'dark',
  Background: '#002b36',
  Foreground: '#839496',
  LightBlue: '#268bd2',
  AccentBlue: '#268bd2',
  AccentPurple: '#6c71c4',
  AccentCyan: '#2aa198',
  AccentGreen: '#859900',
  AccentYellow: '#b58900',
  AccentRed: '#dc322f',
  DiffAdded: '#1a2f00',
  DiffRemoved: '#2f0000',
  Comment: '#93a1a1',
  Gray: '#657b83',
  DarkGray: interpolateColor('#657b83', '#002b36', 0.5),
  GradientColors: ['#268bd2', '#2aa198'],
};

export const OdysseusSolarized: Theme = new Theme(
  'Odysseus Solarized',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: odysseusSolarizedColors.Background,
      color: odysseusSolarizedColors.Foreground,
    },
    'hljs-keyword': {
      color: odysseusSolarizedColors.AccentGreen,
      fontWeight: 'bold',
    },
    'hljs-literal': {
      color: odysseusSolarizedColors.AccentCyan,
    },
    'hljs-symbol': {
      color: odysseusSolarizedColors.AccentCyan,
    },
    'hljs-name': {
      color: odysseusSolarizedColors.AccentBlue,
    },
    'hljs-link': {
      color: odysseusSolarizedColors.AccentBlue,
      textDecoration: 'underline',
    },
    'hljs-built_in': {
      color: odysseusSolarizedColors.AccentCyan,
    },
    'hljs-type': {
      color: odysseusSolarizedColors.AccentYellow,
    },
    'hljs-number': {
      color: odysseusSolarizedColors.AccentCyan,
    },
    'hljs-class': {
      color: odysseusSolarizedColors.AccentYellow,
    },
    'hljs-string': {
      color: odysseusSolarizedColors.AccentCyan,
    },
    'hljs-meta-string': {
      color: odysseusSolarizedColors.AccentCyan,
    },
    'hljs-regexp': {
      color: odysseusSolarizedColors.AccentRed,
    },
    'hljs-template-tag': {
      color: odysseusSolarizedColors.AccentRed,
    },
    'hljs-subst': {
      color: odysseusSolarizedColors.Foreground,
    },
    'hljs-function': {
      color: odysseusSolarizedColors.AccentBlue,
    },
    'hljs-title': {
      color: odysseusSolarizedColors.AccentBlue,
      fontWeight: 'bold',
    },
    'hljs-params': {
      color: odysseusSolarizedColors.Foreground,
    },
    'hljs-formula': {
      color: odysseusSolarizedColors.Foreground,
    },
    'hljs-comment': {
      color: odysseusSolarizedColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: odysseusSolarizedColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-doctag': {
      color: odysseusSolarizedColors.Comment,
    },
    'hljs-meta': {
      color: odysseusSolarizedColors.Gray,
    },
    'hljs-meta-keyword': {
      color: odysseusSolarizedColors.Gray,
    },
    'hljs-tag': {
      color: odysseusSolarizedColors.Gray,
    },
    'hljs-variable': {
      color: odysseusSolarizedColors.AccentPurple,
    },
    'hljs-template-variable': {
      color: odysseusSolarizedColors.AccentPurple,
    },
    'hljs-attr': {
      color: odysseusSolarizedColors.AccentYellow,
    },
    'hljs-attribute': {
      color: odysseusSolarizedColors.AccentYellow,
    },
    'hljs-builtin-name': {
      color: odysseusSolarizedColors.AccentYellow,
    },
    'hljs-section': {
      color: odysseusSolarizedColors.AccentYellow,
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-bullet': {
      color: odysseusSolarizedColors.AccentYellow,
    },
    'hljs-selector-tag': {
      color: odysseusSolarizedColors.AccentGreen,
    },
    'hljs-selector-id': {
      color: odysseusSolarizedColors.AccentYellow,
    },
    'hljs-selector-class': {
      color: odysseusSolarizedColors.AccentGreen,
    },
    'hljs-addition': {
      backgroundColor: '#1a2f00',
      display: 'inline-block',
      width: '100%',
    },
    'hljs-deletion': {
      backgroundColor: '#2f0000',
      display: 'inline-block',
      width: '100%',
    },
  },
  odysseusSolarizedColors,
);
