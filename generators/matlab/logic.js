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
 * @fileoverview Generating Matlab for logic blocks.
 */
'use strict';

goog.module('Blockly.Matlab.logic');

const Matlab = goog.require('Blockly.Matlab');


Matlab['controls_if'] = function(block) {
  // If/elseif/else condition.
  let n = 0;
  let code = '', branchCode, conditionCode;
  if (Matlab.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    code += Matlab.injectId(Matlab.STATEMENT_PREFIX, block);
  }
  do {
    conditionCode =
        Matlab.valueToCode(block, 'IF' + n, Matlab.ORDER_NONE) || 'false';
    branchCode = Matlab.statementToCode(block, 'DO' + n) || Matlab.PASS;
    if (Matlab.STATEMENT_SUFFIX) {
      branchCode =
          Matlab.prefixLines(
              Matlab.injectId(Matlab.STATEMENT_SUFFIX, block), Matlab.INDENT) +
          branchCode;
    }
    code += (n === 0 ? 'if ' : 'elseif ') + conditionCode + '\n' + branchCode;
    n++;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE') || Matlab.STATEMENT_SUFFIX) {
    branchCode = Matlab.statementToCode(block, 'ELSE') || Matlab.PASS;
    if (Matlab.STATEMENT_SUFFIX) {
      branchCode =
          Matlab.prefixLines(
              Matlab.injectId(Matlab.STATEMENT_SUFFIX, block), Matlab.INDENT) +
          branchCode;
    }
    code += 'else\n' + branchCode;
  }

  code += 'end\n';

  return code;
};

Matlab['controls_ifelse'] = Matlab['controls_if'];

Matlab['logic_compare'] = function(block) {
  // Comparison operator.
  const OPERATORS =
      {'EQ': '==', 'NEQ': '~=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>='};
  const operator = OPERATORS[block.getFieldValue('OP')];
  const order = Matlab.ORDER_RELATIONAL;
  const argument0 = Matlab.valueToCode(block, 'A', order) || '0';
  const argument1 = Matlab.valueToCode(block, 'B', order) || '0';
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Matlab['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  const operator = (block.getFieldValue('OP') === 'AND') ? '&&' : '||';
  const order =
      (operator === '&&') ? Matlab.ORDER_LOGICAL_AND : Matlab.ORDER_LOGICAL_OR;
  let argument0 = Matlab.valueToCode(block, 'A', order);
  let argument1 = Matlab.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Single missing arguments have no effect on the return value.
    const defaultArgument = (operator === '&&') ? 'true' : 'false';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Matlab['logic_negate'] = function(block) {
  // Negation.
  const argument0 =
      Matlab.valueToCode(block, 'BOOL', Matlab.ORDER_LOGICAL_NOT) || 'true';
  const code = '~' + argument0;
  return [code, Matlab.ORDER_LOGICAL_NOT];
};

Matlab['logic_boolean'] = function(block) {
  // Boolean values true and false.
  const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'true' : 'false';
  return [code, Matlab.ORDER_ATOMIC];
};

Matlab['logic_null'] = function(block) {
  // Null data type.
  return ['[]', Matlab.ORDER_ATOMIC];
};

Matlab['logic_ternary'] = function(block) {
  // Ternary operator.
  const value_if =
      Matlab.valueToCode(block, 'IF', Matlab.ORDER_CONDITIONAL) || 'false';
  const value_then =
      Matlab.valueToCode(block, 'THEN', Matlab.ORDER_CONDITIONAL) || '[]';
  const value_else =
      Matlab.valueToCode(block, 'ELSE', Matlab.ORDER_CONDITIONAL) || '[]';

  const functionName = Matlab.provideFunction_('ternarySubstituteOperator', [
        'function ret = ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(varargin) ret = varargin{length(varargin)-varargin{1}}; end;']);

  const code = functionName + '(' + value_if + ', ' + value_then + ', ' + value_else + ')';
  return [code, Matlab.ORDER_CONDITIONAL];
};
