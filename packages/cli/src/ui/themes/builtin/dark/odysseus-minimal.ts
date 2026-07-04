/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from '../../theme.js';
import { interpolateColor } from '../../color-utils.js';

// Ported from the Odysseus UI project (OpenHarness "minimal" theme)
const odysseusMinimalColors: ColorsTheme = {
  type: 'dark',
  Background: '#000000',
  Foreground: '#ffffff',
  LightBlue: '#cccccc',
  AccentBlue: '#ffffff',
  AccentPurple: '#cccccc',
  AccentCyan: '#999999',
  AccentGreen: '#cccccc',
  AccentYellow: '#cccccc',
  AccentRed: '#ff0000',
  DiffAdded: '#003300',
  DiffRemoved: '#330000',
  Comment: '#666666',
  Gray: '#666666',
  DarkGray: interpolateColor('#666666', '#000000', 0.5),
  GradientColors: ['#ffffff', '#cccccc'],
};

export const OdysseusMinimal: Theme = new Theme(
  'Odysseus Minimal',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: odysseusMinimalColors.Background,
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-keyword': {
      color: odysseusMinimalColors.Foreground,
      fontWeight: 'bold',
    },
    'hljs-literal': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-symbol': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-name': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-link': {
      color: odysseusMinimalColors.Foreground,
      textDecoration: 'underline',
    },
    'hljs-built_in': {
      color: odysseusMinimalColors.AccentCyan,
    },
    'hljs-type': {
      color: odysseusMinimalColors.LightBlue,
    },
    'hljs-number': {
      color: odysseusMinimalColors.AccentGreen,
    },
    'hljs-class': {
      color: odysseusMinimalColors.LightBlue,
    },
    'hljs-string': {
      color: odysseusMinimalColors.AccentCyan,
    },
    'hljs-meta-string': {
      color: odysseusMinimalColors.AccentCyan,
    },
    'hljs-regexp': {
      color: odysseusMinimalColors.AccentRed,
    },
    'hljs-template-tag': {
      color: odysseusMinimalColors.AccentRed,
    },
    'hljs-subst': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-function': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-title': {
      color: odysseusMinimalColors.Foreground,
      fontWeight: 'bold',
    },
    'hljs-params': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-formula': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-comment': {
      color: odysseusMinimalColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: odysseusMinimalColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-doctag': {
      color: odysseusMinimalColors.Comment,
    },
    'hljs-meta': {
      color: odysseusMinimalColors.Gray,
    },
    'hljs-meta-keyword': {
      color: odysseusMinimalColors.Gray,
    },
    'hljs-tag': {
      color: odysseusMinimalColors.Gray,
    },
    'hljs-variable': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-template-variable': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-attr': {
      color: odysseusMinimalColors.LightBlue,
    },
    'hljs-attribute': {
      color: odysseusMinimalColors.LightBlue,
    },
    'hljs-builtin-name': {
      color: odysseusMinimalColors.LightBlue,
    },
    'hljs-section': {
      color: odysseusMinimalColors.Foreground,
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-bullet': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-selector-tag': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-selector-id': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-selector-class': {
      color: odysseusMinimalColors.Foreground,
    },
    'hljs-addition': {
      backgroundColor: '#003300',
      display: 'inline-block',
      width: '100%',
    },
    'hljs-deletion': {
      backgroundColor: '#330000',
      display: 'inline-block',
      width: '100%',
    },
  },
  odysseusMinimalColors,
);
