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
 * @fileoverview Generating Matlab for variable blocks.
 */
'use strict';

goog.module('Blockly.Matlab.variables');

const Matlab = goog.require('Blockly.Matlab');
const {NameType} = goog.require('Blockly.Names');


Matlab['variables_get'] = function(block) {
  // Variable getter.
  const code =
      Matlab.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return [code, Matlab.ORDER_ATOMIC];
};

Matlab['variables_set'] = function(block) {
  // Variable setter.
  const argument0 =
      Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '0';
  const varName =
      Matlab.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return varName + ' = ' + argument0 + ';\n';
};
