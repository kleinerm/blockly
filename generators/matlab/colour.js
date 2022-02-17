/**
 * @license
 * Copyright 2012 Google LLC
 *
 * Copyright 2022 Mario Kleiner - Derived from/starting as an identical copy of
 * the corresponding Python generator files at 17th February 2022, with all "Python"
 * words replaced with "Matlab", and then piece-by-piece rewritten to become a
 * Matlab code generator in followup commits.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Matlab for colour blocks.
 */
'use strict';

goog.module('Blockly.Matlab.colour');

const Matlab = goog.require('Blockly.Matlab');


Matlab['colour_picker'] = function(block) {
  // Colour picker.
  const code = Matlab.quote_(block.getFieldValue('COLOUR'));
  return [code, Matlab.ORDER_ATOMIC];
};

Matlab['colour_random'] = function(block) {
  // Generate a random colour.
  Matlab.definitions_['import_random'] = 'import random';
  const code = '\'#%06x\' % random.randint(0, 2**24 - 1)';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['colour_rgb'] = function(block) {
  // Compose a colour from RGB components expressed as percentages.
  const functionName = Matlab.provideFunction_('colour_rgb', [
    'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(r, g, b):',
    '  r = round(min(100, max(0, r)) * 2.55)',
    '  g = round(min(100, max(0, g)) * 2.55)',
    '  b = round(min(100, max(0, b)) * 2.55)',
    '  return \'#%02x%02x%02x\' % (r, g, b)'
  ]);
  const r = Matlab.valueToCode(block, 'RED', Matlab.ORDER_NONE) || 0;
  const g = Matlab.valueToCode(block, 'GREEN', Matlab.ORDER_NONE) || 0;
  const b = Matlab.valueToCode(block, 'BLUE', Matlab.ORDER_NONE) || 0;
  const code = functionName + '(' + r + ', ' + g + ', ' + b + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['colour_blend'] = function(block) {
  // Blend two colours together.
  const functionName = Matlab.provideFunction_('colour_blend', [
    'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(colour1, colour2, ratio):',
    '  r1, r2 = int(colour1[1:3], 16), int(colour2[1:3], 16)',
    '  g1, g2 = int(colour1[3:5], 16), int(colour2[3:5], 16)',
    '  b1, b2 = int(colour1[5:7], 16), int(colour2[5:7], 16)',
    '  ratio = min(1, max(0, ratio))',
    '  r = round(r1 * (1 - ratio) + r2 * ratio)',
    '  g = round(g1 * (1 - ratio) + g2 * ratio)',
    '  b = round(b1 * (1 - ratio) + b2 * ratio)',
    '  return \'#%02x%02x%02x\' % (r, g, b)'
  ]);
  const colour1 =
      Matlab.valueToCode(block, 'COLOUR1', Matlab.ORDER_NONE) || '\'#000000\'';
  const colour2 =
      Matlab.valueToCode(block, 'COLOUR2', Matlab.ORDER_NONE) || '\'#000000\'';
  const ratio = Matlab.valueToCode(block, 'RATIO', Matlab.ORDER_NONE) || 0;
  const code =
      functionName + '(' + colour1 + ', ' + colour2 + ', ' + ratio + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};
