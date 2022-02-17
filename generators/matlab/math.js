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
    code = 'float("inf")';
    order = Matlab.ORDER_FUNCTION_CALL;
  } else if (code === -Infinity) {
    code = '-float("inf")';
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
    'POWER': [' ** ', Matlab.ORDER_EXPONENTIATION]
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = Matlab.valueToCode(block, 'A', order) || '0';
  const argument1 = Matlab.valueToCode(block, 'B', order) || '0';
  const code = argument0 + operator + argument1;
  return [code, order];
  // In case of 'DIVIDE', division between integers returns different results
  // in Matlab 2 and 3. However, is not an issue since Blockly does not
  // guarantee identical results in all languages.  To do otherwise would
  // require every operator to be wrapped in a function call.  This would kill
  // legibility of the generated code.
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
  Matlab.definitions_['import_math'] = 'import math';
  if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = Matlab.valueToCode(block, 'NUM', Matlab.ORDER_MULTIPLICATIVE) || '0';
  } else {
    arg = Matlab.valueToCode(block, 'NUM', Matlab.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'math.fabs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'math.sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'math.log(' + arg + ')';
      break;
    case 'LOG10':
      code = 'math.log10(' + arg + ')';
      break;
    case 'EXP':
      code = 'math.exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'math.pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'math.ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'math.floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'math.sin(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'COS':
      code = 'math.cos(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'TAN':
      code = 'math.tan(' + arg + ' / 180.0 * math.pi)';
      break;
  }
  if (code) {
    return [code, Matlab.ORDER_FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ASIN':
      code = 'math.asin(' + arg + ') / math.pi * 180';
      break;
    case 'ACOS':
      code = 'math.acos(' + arg + ') / math.pi * 180';
      break;
    case 'ATAN':
      code = 'math.atan(' + arg + ') / math.pi * 180';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, Matlab.ORDER_MULTIPLICATIVE];
};

Matlab['math_constant'] = function(block) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  const CONSTANTS = {
    'PI': ['math.pi', Matlab.ORDER_MEMBER],
    'E': ['math.e', Matlab.ORDER_MEMBER],
    'GOLDEN_RATIO': ['(1 + math.sqrt(5)) / 2', Matlab.ORDER_MULTIPLICATIVE],
    'SQRT2': ['math.sqrt(2)', Matlab.ORDER_MEMBER],
    'SQRT1_2': ['math.sqrt(1.0 / 2)', Matlab.ORDER_MEMBER],
    'INFINITY': ['float(\'inf\')', Matlab.ORDER_ATOMIC]
  };
  const constant = block.getFieldValue('CONSTANT');
  if (constant !== 'INFINITY') {
    Matlab.definitions_['import_math'] = 'import math';
  }
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
  if (dropdown_property === 'PRIME') {
    Matlab.definitions_['import_math'] = 'import math';
    Matlab.definitions_['from_numbers_import_Number'] =
        'from numbers import Number';
    const functionName = Matlab.provideFunction_('math_isPrime', [
      'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(n):',
      '  # https://en.wikipedia.org/wiki/Primality_test#Naive_methods',
      '  # If n is not a number but a string, try parsing it.',
      '  if not isinstance(n, Number):', '    try:', '      n = float(n)',
      '    except:', '      return False',
      '  if n == 2 or n == 3:', '    return True',
      '  # False if n is negative, is 1, or not whole,' +
          ' or if n is divisible by 2 or 3.',
      '  if n <= 1 or n % 1 != 0 or n % 2 == 0 or n % 3 == 0:',
      '    return False',
      '  # Check all the numbers of form 6k +/- 1, up to sqrt(n).',
      '  for x in range(6, int(math.sqrt(n)) + 2, 6):',
      '    if n % (x - 1) == 0 or n % (x + 1) == 0:', '      return False',
      '  return True'
    ]);
    code = functionName + '(' + number_to_check + ')';
    return [code, Matlab.ORDER_FUNCTION_CALL];
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = number_to_check + ' % 2 == 0';
      break;
    case 'ODD':
      code = number_to_check + ' % 2 == 1';
      break;
    case 'WHOLE':
      code = number_to_check + ' % 1 == 0';
      break;
    case 'POSITIVE':
      code = number_to_check + ' > 0';
      break;
    case 'NEGATIVE':
      code = number_to_check + ' < 0';
      break;
    case 'DIVISIBLE_BY': {
      const divisor =
          Matlab.valueToCode(block, 'DIVISOR', Matlab.ORDER_MULTIPLICATIVE);
      // If 'divisor' is some code that evals to 0, Matlab will raise an error.
      if (!divisor || divisor === '0') {
        return ['False', Matlab.ORDER_ATOMIC];
      }
      code = number_to_check + ' % ' + divisor + ' == 0';
      break;
    }
  }
  return [code, Matlab.ORDER_RELATIONAL];
};

Matlab['math_change'] = function(block) {
  // Add to a variable in place.
  Matlab.definitions_['from_numbers_import_Number'] =
      'from numbers import Number';
  const argument0 =
      Matlab.valueToCode(block, 'DELTA', Matlab.ORDER_ADDITIVE) || '0';
  const varName =
      Matlab.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return varName + ' = (' + varName + ' if isinstance(' + varName +
      ', Number) else 0) + ' + argument0 + '\n';
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
      Matlab.definitions_['from_numbers_import_Number'] =
          'from numbers import Number';
      const functionName = Matlab.provideFunction_(
          'math_mean',
          // This operation excludes null and values that aren't int or float:
          // math_mean([null, null, "aString", 1, 9]) -> 5.0
          [
            'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(myList):',
            '  localList = [e for e in myList if isinstance(e, Number)]',
            '  if not localList: return',
            '  return float(sum(localList)) / len(localList)'
          ]);
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MEDIAN': {
      Matlab.definitions_['from_numbers_import_Number'] =
          'from numbers import Number';
      const functionName = Matlab.provideFunction_(
          'math_median',
          // This operation excludes null values:
          // math_median([null, null, 1, 3]) -> 2.0
          [
            'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(myList):',
            '  localList = sorted([e for e in myList if isinstance(e, Number)])',
            '  if not localList: return', '  if len(localList) % 2 == 0:',
            '    return (localList[len(localList) // 2 - 1] + ' +
                'localList[len(localList) // 2]) / 2.0',
            '  else:', '    return localList[(len(localList) - 1) // 2]'
          ]);
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MODE': {
      const functionName = Matlab.provideFunction_(
          'math_modes',
          // As a list of numbers can contain more than one mode,
          // the returned result is provided as an array.
          // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1]
          [
            'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(some_list):',
            '  modes = []',
            '  # Using a lists of [item, count] to keep count rather than dict',
            '  # to avoid "unhashable" errors when the counted item is ' +
                'itself a list or dict.',
            '  counts = []', '  maxCount = 1', '  for item in some_list:',
            '    found = False', '    for count in counts:',
            '      if count[0] == item:', '        count[1] += 1',
            '        maxCount = max(maxCount, count[1])',
            '        found = True',
            '    if not found:', '      counts.append([item, 1])',
            '  for counted_item, item_count in counts:',
            '    if item_count == maxCount:',
            '      modes.append(counted_item)', '  return modes'
          ]);
      code = functionName + '(' + list + ')';
      break;
    }
    case 'STD_DEV': {
      Matlab.definitions_['import_math'] = 'import math';
      const functionName = Matlab.provideFunction_('math_standard_deviation', [
        'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(numbers):',
        '  n = len(numbers)', '  if n == 0: return',
        '  mean = float(sum(numbers)) / n',
        '  variance = sum((x - mean) ** 2 for x in numbers) / n',
        '  return math.sqrt(variance)'
      ]);
      code = functionName + '(' + list + ')';
      break;
    }
    case 'RANDOM':
      Matlab.definitions_['import_random'] = 'import random';
      code = 'random.choice(' + list + ')';
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
  const code = argument0 + ' % ' + argument1;
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
  Matlab.definitions_['import_random'] = 'import random';
  const argument0 = Matlab.valueToCode(block, 'FROM', Matlab.ORDER_NONE) || '0';
  const argument1 = Matlab.valueToCode(block, 'TO', Matlab.ORDER_NONE) || '0';
  const code = 'random.randint(' + argument0 + ', ' + argument1 + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['math_random_float'] = function(block) {
  // Random fraction between 0 and 1.
  Matlab.definitions_['import_random'] = 'import random';
  return ['random.random()', Matlab.ORDER_FUNCTION_CALL];
};

Matlab['math_atan2'] = function(block) {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  Matlab.definitions_['import_math'] = 'import math';
  const argument0 = Matlab.valueToCode(block, 'X', Matlab.ORDER_NONE) || '0';
  const argument1 = Matlab.valueToCode(block, 'Y', Matlab.ORDER_NONE) || '0';
  return [
    'math.atan2(' + argument1 + ', ' + argument0 + ') / math.pi * 180',
    Matlab.ORDER_MULTIPLICATIVE
  ];
};
