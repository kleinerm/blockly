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
  const colour = Matlab.quote_(block.getFieldValue('COLOUR'));
  const code = '[' + parseInt(colour.substring(2, 4), 16) + ', ' + parseInt(colour.substring(4, 6), 16) + ', ' + parseInt(colour.substring(6, 8), 16) + '] / 255' 
  return [code, Matlab.ORDER_ATOMIC];
};

Matlab['colour_random'] = function(block) {
  // Generate a random colour.
  const code = 'rand(1,3)';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['colour_rgb'] = function(block) {
  // Compose a colour from RGB components expressed as percentages.
  const r = Matlab.valueToCode(block, 'RED', Matlab.ORDER_NONE) || 0;
  const g = Matlab.valueToCode(block, 'GREEN', Matlab.ORDER_NONE) || 0;
  const b = Matlab.valueToCode(block, 'BLUE', Matlab.ORDER_NONE) || 0;
  const code = 'max(0, min(100, [' + r + ', ' + g + ', ' + b + '])) / 100';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['colour_blend'] = function(block) {
  // Blend two colours together.
  const functionName = Matlab.provideFunction_('colour_blend', [
    'function blended = ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(colour1, colour2, ratio)',
    '  ratio = min(1, max(0, ratio));',
    '  blended = colour1 * (1 - ratio) + colour2 * ratio;',
    'end;'
  ]);
  const colour1 =
      Matlab.valueToCode(block, 'COLOUR1', Matlab.ORDER_NONE) || '[0, 0, 0]';
  const colour2 =
      Matlab.valueToCode(block, 'COLOUR2', Matlab.ORDER_NONE) || '[0, 0, 0]';
  const ratio = Matlab.valueToCode(block, 'RATIO', Matlab.ORDER_NONE) || 0;
  const code =
      functionName + '(' + colour1 + ', ' + colour2 + ', ' + ratio + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};
