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
 * @fileoverview Generating Matlab for math blocks.
 */
'use strict';

goog.module('Blockly.Matlab.math');

const Matlab = goog.require('Blockly.Matlab');
const {NameType} = goog.require('Blockly.Names');


// If any new block imports any library, add that library name here.
Matlab.addReservedWords('math,random,Number');

Matlab['math_number'] = function(block) {
  // Numeric value.
  let code = Number(block.getFieldValue('NUM'));
  let order;
  if (code === Infinity) {
    code = 'Inf';
    order = Matlab.ORDER_FUNCTION_CALL;
  } else if (code === -Infinity) {
    code = '-Inf';
    order = Matlab.ORDER_UNARY_SIGN;
  } else {
    order = code < 0 ? Matlab.ORDER_UNARY_SIGN : Matlab.ORDER_ATOMIC;
  }
  return [code, order];
};

Matlab['math_arithmetic'] = function(block) {
  // Basic arithmetic operators, and power.
  const OPERATORS = {
    'ADD': [' + ', Matlab.ORDER_ADDITIVE],
    'MINUS': [' - ', Matlab.ORDER_ADDITIVE],
    'MULTIPLY': [' * ', Matlab.ORDER_MULTIPLICATIVE],
    'DIVIDE': [' / ', Matlab.ORDER_MULTIPLICATIVE],
    'POWER': [' ^ ', Matlab.ORDER_EXPONENTIATION]
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = Matlab.valueToCode(block, 'A', order) || '0';
  const argument1 = Matlab.valueToCode(block, 'B', order) || '0';
  const code = argument0 + operator + argument1;
  return [code, order];
};

Matlab['math_single'] = function(block) {
  // Math operators with single operand.
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    // Negation is a special case given its different operator precedence.
    code = Matlab.valueToCode(block, 'NUM', Matlab.ORDER_UNARY_SIGN) || '0';
    return ['-' + code, Matlab.ORDER_UNARY_SIGN];
  }

  if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = Matlab.valueToCode(block, 'NUM', Matlab.ORDER_MULTIPLICATIVE) || '0';
  } else {
    arg = Matlab.valueToCode(block, 'NUM', Matlab.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'abs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'log(' + arg + ')';
      break;
    case 'LOG10':
      code = 'log10(' + arg + ')';
      break;
    case 'EXP':
      code = 'exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'power(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'sin(' + arg + ' / 180.0 * pi)';
      break;
    case 'COS':
      code = 'cos(' + arg + ' / 180.0 * pi)';
      break;
    case 'TAN':
      code = 'tan(' + arg + ' / 180.0 * pi)';
      break;
  }
  if (code) {
    return [code, Matlab.ORDER_FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ASIN':
      code = 'asin(' + arg + ') / pi * 180';
      break;
    case 'ACOS':
      code = 'acos(' + arg + ') / pi * 180';
      break;
    case 'ATAN':
      code = 'atan(' + arg + ') / pi * 180';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, Matlab.ORDER_MULTIPLICATIVE];
};

Matlab['math_constant'] = function(block) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  const CONSTANTS = {
    'PI': ['pi', Matlab.ORDER_MEMBER],
    'E': ['e', Matlab.ORDER_MEMBER],
    'GOLDEN_RATIO': ['(1 + sqrt(5)) / 2', Matlab.ORDER_MULTIPLICATIVE],
    'SQRT2': ['sqrt(2)', Matlab.ORDER_MEMBER],
    'SQRT1_2': ['sqrt(1.0 / 2)', Matlab.ORDER_MEMBER],
    'INFINITY': ['Inf', Matlab.ORDER_ATOMIC]
  };
  const constant = block.getFieldValue('CONSTANT');
  return CONSTANTS[constant];
};

Matlab['math_number_property'] = function(block) {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  const number_to_check =
      Matlab.valueToCode(
          block, 'NUMBER_TO_CHECK', Matlab.ORDER_MULTIPLICATIVE) ||
      '0';
  const dropdown_property = block.getFieldValue('PROPERTY');
  let code;
  switch (dropdown_property) {
    case 'PRIME':
      code = 'isprime(' + number_to_check + ')';
      break;
    case 'EVEN':
      code = 'mod(' + number_to_check + ', 2) == 0';
      break;
    case 'ODD':
      code = 'mod(' + number_to_check + ', 2) == 1';
      break;
    case 'WHOLE':
      code = 'mod(' + number_to_check + ', 1) == 0';
      break;
    case 'POSITIVE':
      code = number_to_check + ' > 0';
      break;
    case 'NEGATIVE':
      code = number_to_check + ' < 0';
      break;
    case 'DIVISIBLE_BY': {
      const divisor = Matlab.valueToCode(block, 'DIVISOR', Matlab.ORDER_MULTIPLICATIVE);
      code = 'mod(' + number_to_check + ', ' + divisor + ') == 0';
      break;
    }
  }
  return [code, Matlab.ORDER_RELATIONAL];
};

Matlab['math_change'] = function(block) {
  // Add to a variable in place.
  const argument0 =
      Matlab.valueToCode(block, 'DELTA', Matlab.ORDER_ADDITIVE) || '0';
  const varName =
      Matlab.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return varName + ' = ' + varName + ' + ' + argument0 + ';\n';
};

// Rounding functions have a single operand.
Matlab['math_round'] = Matlab['math_single'];
// Trigonometry functions have a single operand.
Matlab['math_trig'] = Matlab['math_single'];

Matlab['math_on_list'] = function(block) {
  // Math functions for lists.
  const func = block.getFieldValue('OP');
  const list = Matlab.valueToCode(block, 'LIST', Matlab.ORDER_NONE) || '[]';
  let code;
  switch (func) {
    case 'SUM':
      code = 'sum(' + list + ')';
      break;
    case 'MIN':
      code = 'min(' + list + ')';
      break;
    case 'MAX':
      code = 'max(' + list + ')';
      break;
    case 'AVERAGE': {
      code = 'mean(' + list + ')';
      break;
    }
    case 'MEDIAN': {
      code = 'median(' + list + ')';
      break;
    }
    case 'MODE': {
      code = 'mode(' + list + ')';
      break;
    }
    case 'STD_DEV': {
      code = 'std(' + list + ')';
      break;
    }
    case 'RANDOM':
      code = list + '(randi(length(' + list + ')))';
      break;
    default:
      throw Error('Unknown operator: ' + func);
  }
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['math_modulo'] = function(block) {
  // Remainder computation.
  const argument0 =
      Matlab.valueToCode(block, 'DIVIDEND', Matlab.ORDER_MULTIPLICATIVE) || '0';
  const argument1 =
      Matlab.valueToCode(block, 'DIVISOR', Matlab.ORDER_MULTIPLICATIVE) || '0';
  const code = 'mod(' + argument0 + ', ' + argument1 + ')';
  return [code, Matlab.ORDER_MULTIPLICATIVE];
};

Matlab['math_constrain'] = function(block) {
  // Constrain a number between two limits.
  const argument0 =
      Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '0';
  const argument1 = Matlab.valueToCode(block, 'LOW', Matlab.ORDER_NONE) || '0';
  const argument2 =
      Matlab.valueToCode(block, 'HIGH', Matlab.ORDER_NONE) || 'float(\'inf\')';
  const code =
      'min(max(' + argument0 + ', ' + argument1 + '), ' + argument2 + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['math_random_int'] = function(block) {
  // Random integer between [X] and [Y].
  const argument0 = Matlab.valueToCode(block, 'FROM', Matlab.ORDER_NONE) || '0';
  const argument1 = Matlab.valueToCode(block, 'TO', Matlab.ORDER_NONE) || '0';
  const code = 'randi([' + argument0 + ', ' + argument1 + '])';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['math_random_float'] = function(block) {
  // Random fraction between 0 and 1.
  return ['rand()', Matlab.ORDER_FUNCTION_CALL];
};

Matlab['math_atan2'] = function(block) {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  const argument0 = Matlab.valueToCode(block, 'X', Matlab.ORDER_NONE) || '0';
  const argument1 = Matlab.valueToCode(block, 'Y', Matlab.ORDER_NONE) || '0';
  return ['atan2(' + argument1 + ', ' + argument0 + ') / pi * 180', Matlab.ORDER_MULTIPLICATIVE];
};
