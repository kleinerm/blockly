/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Copyright 2022 Mario Kleiner - Derived from/starting as an identical copy of
 * the corresponding Python generator files at 17th February 2022, with all "Python"
 * words replaced with "Matlab", and then piece-by-piece rewritten to become a
 * Matlab code generator in followup commits.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Matlab for dynamic variable blocks.
 */
'use strict';

goog.module('Blockly.Matlab.variablesDynamic');

const Matlab = goog.require('Blockly.Matlab');
/** @suppress {extraRequire} */
goog.require('Blockly.Matlab.variables');


// Matlab is dynamically typed.
Matlab['variables_get_dynamic'] = Matlab['variables_get'];
Matlab['variables_set_dynamic'] = Matlab['variables_set'];
