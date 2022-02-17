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
 * @fileoverview Generating Matlab for list blocks.
 */
'use strict';

goog.module('Blockly.Matlab.lists');

const Matlab = goog.require('Blockly.Matlab');
const stringUtils = goog.require('Blockly.utils.string');
const {NameType} = goog.require('Blockly.Names');


Matlab['lists_create_empty'] = function(block) {
  // Create an empty list.
  return ['[]', Matlab.ORDER_ATOMIC];
};

Matlab['lists_create_with'] = function(block) {
  // Create a list with any number of elements of any type.
  const elements = new Array(block.itemCount_);
  for (let i = 0; i < block.itemCount_; i++) {
    elements[i] =
        Matlab.valueToCode(block, 'ADD' + i, Matlab.ORDER_NONE) || 'None';
  }
  const code = '[' + elements.join(', ') + ']';
  return [code, Matlab.ORDER_ATOMIC];
};

Matlab['lists_repeat'] = function(block) {
  // Create a list with one element repeated.
  const item = Matlab.valueToCode(block, 'ITEM', Matlab.ORDER_NONE) || 'None';
  const times =
      Matlab.valueToCode(block, 'NUM', Matlab.ORDER_MULTIPLICATIVE) || '0';
  const code = '[' + item + '] * ' + times;
  return [code, Matlab.ORDER_MULTIPLICATIVE];
};

Matlab['lists_length'] = function(block) {
  // String or array length.
  const list = Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '[]';
  return ['len(' + list + ')', Matlab.ORDER_FUNCTION_CALL];
};

Matlab['lists_isEmpty'] = function(block) {
  // Is the string null or array empty?
  const list = Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '[]';
  const code = 'not len(' + list + ')';
  return [code, Matlab.ORDER_LOGICAL_NOT];
};

Matlab['lists_indexOf'] = function(block) {
  // Find an item in the list.
  const item = Matlab.valueToCode(block, 'FIND', Matlab.ORDER_NONE) || '[]';
  const list = Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '\'\'';
  let errorIndex = ' -1';
  let firstIndexAdjustment = '';
  let lastIndexAdjustment = ' - 1';

  if (block.workspace.options.oneBasedIndex) {
    errorIndex = ' 0';
    firstIndexAdjustment = ' + 1';
    lastIndexAdjustment = '';
  }

  if (block.getFieldValue('END') === 'FIRST') {
    const functionName = Matlab.provideFunction_('first_index', [
      'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(my_list, elem):',
      '  try: index = my_list.index(elem)' + firstIndexAdjustment,
      '  except: index =' + errorIndex, '  return index'
    ]);
    const code = functionName + '(' + list + ', ' + item + ')';
    return [code, Matlab.ORDER_FUNCTION_CALL];
  }
  const functionName = Matlab.provideFunction_('last_index', [
    'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(my_list, elem):',
    '  try: index = len(my_list) - my_list[::-1].index(elem)' +
        lastIndexAdjustment,
    '  except: index =' + errorIndex, '  return index'
  ]);
  const code = functionName + '(' + list + ', ' + item + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['lists_getIndex'] = function(block) {
  // Get element at index.
  // Note: Until January 2013 this block did not have MODE or WHERE inputs.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const listOrder =
      (where === 'RANDOM') ? Matlab.ORDER_NONE : Matlab.ORDER_MEMBER;
  const list = Matlab.valueToCode(block, 'VALUE', listOrder) || '[]';

  switch (where) {
    case 'FIRST':
      if (mode === 'GET') {
        const code = list + '[0]';
        return [code, Matlab.ORDER_MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.pop(0)';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.pop(0)\n';
      }
      break;
    case 'LAST':
      if (mode === 'GET') {
        const code = list + '[-1]';
        return [code, Matlab.ORDER_MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.pop()';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.pop()\n';
      }
      break;
    case 'FROM_START': {
      const at = Matlab.getAdjustedInt(block, 'AT');
      if (mode === 'GET') {
        const code = list + '[' + at + ']';
        return [code, Matlab.ORDER_MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.pop(' + at + ')';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.pop(' + at + ')\n';
      }
      break;
    }
    case 'FROM_END': {
      const at = Matlab.getAdjustedInt(block, 'AT', 1, true);
      if (mode === 'GET') {
        const code = list + '[' + at + ']';
        return [code, Matlab.ORDER_MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = list + '.pop(' + at + ')';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + '.pop(' + at + ')\n';
      }
      break;
    }
    case 'RANDOM':
      Matlab.definitions_['import_random'] = 'import random';
      if (mode === 'GET') {
        const code = 'random.choice(' + list + ')';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else {
        const functionName =
            Matlab.provideFunction_('lists_remove_random_item', [
              'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(myList):',
              '  x = int(random.random() * len(myList))',
              '  return myList.pop(x)'
            ]);
        const code = functionName + '(' + list + ')';
        if (mode === 'GET_REMOVE') {
          return [code, Matlab.ORDER_FUNCTION_CALL];
        } else if (mode === 'REMOVE') {
          return code + '\n';
        }
      }
      break;
  }
  throw Error('Unhandled combination (lists_getIndex).');
};

Matlab['lists_setIndex'] = function(block) {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  let list = Matlab.valueToCode(block, 'LIST', Matlab.ORDER_MEMBER) || '[]';
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const value = Matlab.valueToCode(block, 'TO', Matlab.ORDER_NONE) || 'None';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  // Closure, which accesses and modifies 'list'.
  function cacheList() {
    if (list.match(/^\w+$/)) {
      return '';
    }
    const listVar =
        Matlab.nameDB_.getDistinctName('tmp_list', NameType.VARIABLE);
    const code = listVar + ' = ' + list + '\n';
    list = listVar;
    return code;
  }

  switch (where) {
    case 'FIRST':
      if (mode === 'SET') {
        return list + '[0] = ' + value + '\n';
      } else if (mode === 'INSERT') {
        return list + '.insert(0, ' + value + ')\n';
      }
      break;
    case 'LAST':
      if (mode === 'SET') {
        return list + '[-1] = ' + value + '\n';
      } else if (mode === 'INSERT') {
        return list + '.append(' + value + ')\n';
      }
      break;
    case 'FROM_START': {
      const at = Matlab.getAdjustedInt(block, 'AT');
      if (mode === 'SET') {
        return list + '[' + at + '] = ' + value + '\n';
      } else if (mode === 'INSERT') {
        return list + '.insert(' + at + ', ' + value + ')\n';
      }
      break;
    }
    case 'FROM_END': {
      const at = Matlab.getAdjustedInt(block, 'AT', 1, true);
      if (mode === 'SET') {
        return list + '[' + at + '] = ' + value + '\n';
      } else if (mode === 'INSERT') {
        return list + '.insert(' + at + ', ' + value + ')\n';
      }
      break;
    }
    case 'RANDOM': {
      Matlab.definitions_['import_random'] = 'import random';
      let code = cacheList();
      const xVar = Matlab.nameDB_.getDistinctName('tmp_x', NameType.VARIABLE);
      code += xVar + ' = int(random.random() * len(' + list + '))\n';
      if (mode === 'SET') {
        code += list + '[' + xVar + '] = ' + value + '\n';
        return code;
      } else if (mode === 'INSERT') {
        code += list + '.insert(' + xVar + ', ' + value + ')\n';
        return code;
      }
      break;
    }
  }
  throw Error('Unhandled combination (lists_setIndex).');
};

Matlab['lists_getSublist'] = function(block) {
  // Get sublist.
  const list = Matlab.valueToCode(block, 'LIST', Matlab.ORDER_MEMBER) || '[]';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = Matlab.getAdjustedInt(block, 'AT1');
      if (at1 === 0) {
        at1 = '';
      }
      break;
    case 'FROM_END':
      at1 = Matlab.getAdjustedInt(block, 'AT1', 1, true);
      break;
    case 'FIRST':
      at1 = '';
      break;
    default:
      throw Error('Unhandled option (lists_getSublist)');
  }

  let at2;
  switch (where2) {
    case 'FROM_START':
      at2 = Matlab.getAdjustedInt(block, 'AT2', 1);
      break;
    case 'FROM_END':
      at2 = Matlab.getAdjustedInt(block, 'AT2', 0, true);
      // Ensure that if the result calculated is 0 that sub-sequence will
      // include all elements as expected.
      if (!stringUtils.isNumber(String(at2))) {
        Matlab.definitions_['import_sys'] = 'import sys';
        at2 += ' or sys.maxsize';
      } else if (at2 === 0) {
        at2 = '';
      }
      break;
    case 'LAST':
      at2 = '';
      break;
    default:
      throw Error('Unhandled option (lists_getSublist)');
  }
  const code = list + '[' + at1 + ' : ' + at2 + ']';
  return [code, Matlab.ORDER_MEMBER];
};

Matlab['lists_sort'] = function(block) {
  // Block for sorting a list.
  const list = (Matlab.valueToCode(block, 'LIST', Matlab.ORDER_NONE) || '[]');
  const type = block.getFieldValue('TYPE');
  const reverse = block.getFieldValue('DIRECTION') === '1' ? 'False' : 'True';
  const sortFunctionName = Matlab.provideFunction_('lists_sort', [
    'def ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(my_list, type, reverse):',
    '  def try_float(s):', '    try:', '      return float(s)', '    except:',
    '      return 0', '  key_funcs = {', '    "NUMERIC": try_float,',
    '    "TEXT": str,', '    "IGNORE_CASE": lambda s: str(s).lower()', '  }',
    '  key_func = key_funcs[type]',
    '  list_cpy = list(my_list)',  // Clone the list.
    '  return sorted(list_cpy, key=key_func, reverse=reverse)'
  ]);

  const code =
      sortFunctionName + '(' + list + ', "' + type + '", ' + reverse + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['lists_split'] = function(block) {
  // Block for splitting text into a list, or joining a list into text.
  const mode = block.getFieldValue('MODE');
  let code;
  if (mode === 'SPLIT') {
    const value_input =
        Matlab.valueToCode(block, 'INPUT', Matlab.ORDER_MEMBER) || '\'\'';
    const value_delim = Matlab.valueToCode(block, 'DELIM', Matlab.ORDER_NONE);
    code = value_input + '.split(' + value_delim + ')';
  } else if (mode === 'JOIN') {
    const value_input =
        Matlab.valueToCode(block, 'INPUT', Matlab.ORDER_NONE) || '[]';
    const value_delim =
        Matlab.valueToCode(block, 'DELIM', Matlab.ORDER_MEMBER) || '\'\'';
    code = value_delim + '.join(' + value_input + ')';
  } else {
    throw Error('Unknown mode: ' + mode);
  }
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['lists_reverse'] = function(block) {
  // Block for reversing a list.
  const list = Matlab.valueToCode(block, 'LIST', Matlab.ORDER_NONE) || '[]';
  const code = 'list(reversed(' + list + '))';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};
