/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Copyright 2022 Mario Kleiner - Derived from/starting as an identical copy of
 * the corresponding Python generator files at 17th February 2022, with all "Python"
 * words replaced with "Matlab", and then piece-by-piece rewritten to become a
 * Matlab code generator in followup commits.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Complete helper functions for generating Matlab for
 *     blocks.  This is the entrypoint for matlab_compressed.js.
 * @suppress {extraRequire}
 */
'use strict';

goog.module('Blockly.Matlab.all');

goog.require('Blockly.Matlab.colour');
goog.require('Blockly.Matlab.lists');
goog.require('Blockly.Matlab.logic');
goog.require('Blockly.Matlab.loops');
goog.require('Blockly.Matlab.math');
goog.require('Blockly.Matlab.procedures');
goog.require('Blockly.Matlab.texts');
goog.require('Blockly.Matlab.variables');
goog.require('Blockly.Matlab.variablesDynamic');

