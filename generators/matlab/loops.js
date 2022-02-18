/**
 * @license
 * Copyright 2012 Google LLC
 *
 * Copyright 2022 Mario Kleiner - Derived from/starting as an identical copy of
 * the corresponding Python generator files at 17th February 2022, with all "Python"
 * words replaced with "Matlab", and then piece-by-piece rewritten to become a
 * Matlab code generator in followup commits. Some routines (e.g., "controls_for"
 * used transplanted code from the corresponding generators/lua/loops.js generator
 * as a starting point.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Matlab for loop blocks.
 */
'use strict';

goog.module('Blockly.Matlab.loops');

const Matlab = goog.require('Blockly.Matlab');
const stringUtils = goog.require('Blockly.utils.string');
const {NameType} = goog.require('Blockly.Names');


Matlab['controls_repeat_ext'] = function(block) {
  // Repeat n times.
  let repeats;
  if (block.getField('TIMES')) {
    // Internal number.
    repeats = String(parseInt(block.getFieldValue('TIMES'), 10));
  } else {
    // External number.
    repeats = Matlab.valueToCode(block, 'TIMES', Matlab.ORDER_NONE) || '0';
  }
  if (stringUtils.isNumber(repeats)) {
    repeats = parseInt(repeats, 10);
  } else {
    repeats = 'int64(' + repeats + ')';
  }
  let branch = Matlab.statementToCode(block, 'DO');
  branch = Matlab.addLoopTrap(branch, block) || Matlab.PASS;
  const loopVar = Matlab.nameDB_.getDistinctName('count', NameType.VARIABLE);
  const code = 'for ' + loopVar + '=1:' + repeats + '\n' + branch + 'end\n';
  return code;
};

Matlab['controls_repeat'] = Matlab['controls_repeat_ext'];

Matlab['controls_whileUntil'] = function(block) {
  // Do while/until loop.
  const until = block.getFieldValue('MODE') === 'UNTIL';
  let argument0 = Matlab.valueToCode(
                      block, 'BOOL',
                      until ? Matlab.ORDER_LOGICAL_NOT : Matlab.ORDER_NONE) ||
      'False';
  let branch = Matlab.statementToCode(block, 'DO');
  branch = Matlab.addLoopTrap(branch, block) || Matlab.PASS;
  if (until) {
    return 'while ~(' + argument0 + ')\n' + branch + 'end\n';
  }
  else {
    return 'while ' + argument0 + '\n' + branch + 'end\n';
  }
};

Matlab['controls_for'] = function(block) {
  // For loop.
  const variable0 =
      Matlab.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  const startVar = Matlab.valueToCode(block, 'FROM', Matlab.ORDER_NONE) || '0';
  const endVar = Matlab.valueToCode(block, 'TO', Matlab.ORDER_NONE) || '0';
  const increment = Matlab.valueToCode(block, 'BY', Matlab.ORDER_NONE) || '1';
  let branch = Matlab.statementToCode(block, 'DO');
  branch = Matlab.addLoopTrap(branch, block);
  //branch = addContinueLabel(branch);

  let code = '';
  let incValue;

  if (stringUtils.isNumber(startVar) && stringUtils.isNumber(endVar) &&
      stringUtils.isNumber(increment)) {
    // All arguments are simple numbers.
    const up = Number(startVar) <= Number(endVar);
    const step = Math.abs(Number(increment));
    incValue = (up ? '' : '-') + step;
  } else {
    // TODO NEEDED? TEST FIX?
    code = '';
    // Determine loop direction at start, in case one of the bounds
    // changes during loop execution.
    incValue =
        Matlab.nameDB_.getDistinctName(variable0 + '_inc', NameType.VARIABLE);
    code += incValue + ' = ';
    if (stringUtils.isNumber(increment)) {
      code += Math.abs(increment) + '\n';
    } else {
      code += 'math.abs(' + increment + ')\n';
    }
    code += 'if (' + startVar + ') > (' + endVar + ')\n';
    code += Matlab.INDENT + incValue + ' = -' + incValue + '\n';
    code += 'end\n';
  }
  code += 'for ' + variable0 + ' = ' + startVar + ':' + incValue + ':' + endVar;
  code += '\n' + branch + 'end\n';

  return code;
};

Matlab['controls_forEach'] = function(block) {
  // For each loop.
  const variable0 =
      Matlab.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  const argument0 =
      Matlab.valueToCode(block, 'LIST', Matlab.ORDER_RELATIONAL) || '[]';
  let branch = Matlab.statementToCode(block, 'DO');
  branch = Matlab.addLoopTrap(branch, block) || Matlab.PASS;
  // TODO TEST FIX
  const code = 'for ' + variable0 + ' = ' + argument0 + '\n' + branch + 'end\n';
  return code;
};

Matlab['controls_flow_statements'] = function(block) {
  // Flow statements: continue, break.
  let xfix = '';
  if (Matlab.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    xfix += Matlab.injectId(Matlab.STATEMENT_PREFIX, block);
  }
  if (Matlab.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the break/continue is triggered.
    xfix += Matlab.injectId(Matlab.STATEMENT_SUFFIX, block);
  }
  if (Matlab.STATEMENT_PREFIX) {
    const loop = block.getSurroundLoop();
    if (loop && !loop.suppressPrefixSuffix) {
      // Inject loop's statement prefix here since the regular one at the end
      // of the loop will not get executed if 'continue' is triggered.
      // In the case of 'break', a prefix is needed due to the loop's suffix.
      xfix += Matlab.injectId(Matlab.STATEMENT_PREFIX, loop);
    }
  }
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return xfix + 'break\n';
    case 'CONTINUE':
      return xfix + 'continue\n';
  }
  throw Error('Unknown flow statement.');
};
