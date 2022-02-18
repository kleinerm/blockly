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

getflattentocelllist = function() {
  functionName = Matlab.provideFunction_('flattentocelllist', [
        'function out = ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(in)\n' +
        '  out = {};\n' +
        '\n' +
        '  if ~iscell(in)\n' +
        '    in = { in };\n' +
        '  end\n' +
        '\n' +
        '  for i = 1:numel(in)\n' +
        '    c = in{i};\n' +
        '    if iscell(c)\n' +
        '      for j = 1:numel(c)\n' +
        '        out{end+1} = c{j};\n' +
        '      end\n' +
        '    else\n' +
        '      out{end+1} = c;\n' +
        '    end\n' +
        '  end\n' +
        'end\n']);

  return functionName;
}

Matlab['lists_create_empty'] = function(block) {
  // Create an empty list.
  return ['{}', Matlab.ORDER_ATOMIC];
};

Matlab['lists_create_with'] = function(block) {
  // Create a list with any number of elements of any type.
  const elements = new Array(block.itemCount_);
  for (let i = 0; i < block.itemCount_; i++) {
    elements[i] =
        Matlab.valueToCode(block, 'ADD' + i, Matlab.ORDER_NONE) || '{}';
  }
  const code = getflattentocelllist() + '({' + elements.join(', ') + '})';
  return [code, Matlab.ORDER_ATOMIC];
};

Matlab['lists_repeat'] = function(block) {
  // Create a list with one element repeated.
  const item = Matlab.valueToCode(block, 'ITEM', Matlab.ORDER_NONE) || '{}';
  const times =
      Matlab.valueToCode(block, 'NUM', Matlab.ORDER_MULTIPLICATIVE) || '0';

  const code = 'repmat(' + getflattentocelllist() + '(' + item + '), 1, ' + times + ')';
  return [code, Matlab.ORDER_MULTIPLICATIVE];
};

Matlab['lists_length'] = function(block) {
  // String or array length.
  const list = Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '{}';
  return ['length(' + list + ')', Matlab.ORDER_FUNCTION_CALL];
};

Matlab['lists_isEmpty'] = function(block) {
  // Is the string null or array empty?
  const list = Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '{}';
  const code = 'isempty(' + list + ')';
  return [code, Matlab.ORDER_LOGICAL_NOT];
};

Matlab['lists_indexOf'] = function(block) {
  // Find an item in the list.
  const item = Matlab.valueToCode(block, 'FIND', Matlab.ORDER_NONE) || '{}';
  const list = Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '{}';
  let errorIndex = ' 0';
  let firstIndexAdjustment = '';
  let lastIndexAdjustment = '';

  if (block.getFieldValue('END') === 'FIRST') {
    const functionName = Matlab.provideFunction_('first_index', [
      'function index = ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(my_list, elem)\n' +
      '  for index = 1:numel(my_list)\n' +
      '    if isequal(my_list(index), elem)\n' +
      '      return;\n' +
      '    end\n' +
      '  end\n' +
      '  index =' + errorIndex + ';\n' +
      'end']);

    const code = functionName + '(flattentocelllist(' + list + '), flattentocelllist(' + item + '))';
    return [code, Matlab.ORDER_FUNCTION_CALL];
  }

  const functionName = Matlab.provideFunction_('last_index', [
    'function index = ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(my_list, elem)\n' +
    '  for index = numel(my_list):-1:1\n' +
    '    if isequal(my_list(index), elem)\n' +
    '      return;\n' +
    '    end\n' +
    '  end\n' +
    '  index =' + errorIndex + ';\n' +
    'end']);

  const code = functionName + '(flattentocelllist(' + list + '), flattentocelllist(' + item + '))';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['lists_getIndex'] = function(block) {
  // Get element at index.
  const getRemoveAt = Matlab.provideFunction_('getRemoveAt', [
  'function v = ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(list, at, dontremove)\n' +
  '  if at < 0\n' +
  '    at = length(list) + 1 + at;\n' +
  '  elseif at == 0\n' +
  '    at = randi(length(list));\n' +
  '  end\n' +
  '  v = list{at};\n' +
  '  if dontremove\n' +
  '    return;\n' +
  '  end\n' +
  '  list = list([1:(at-1), (at+1):length(list)]);\n' +
  '  assignin(\'caller\', inputname(1), list);\n' +
  'end']);

  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const listOrder =
      (where === 'RANDOM') ? Matlab.ORDER_NONE : Matlab.ORDER_MEMBER;
  const list = Matlab.valueToCode(block, 'VALUE', listOrder) || '{}';

  switch (where) {
    case 'FIRST':
      if (mode === 'GET') {
        const code = list + '{1}';
        return [code, Matlab.ORDER_MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = getRemoveAt + '(' + list +', 1, 0)';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + ' = ' + list + '(2:end);\n';
      }
      break;
    case 'LAST':
      if (mode === 'GET') {
        const code = list + '{end}';
        return [code, Matlab.ORDER_MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = getRemoveAt + '(' + list +', -1, 0)';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + ' = ' + list + '(1:end-1);\n';
      }
      break;
    case 'FROM_START': {
      const at = Matlab.getAdjustedInt(block, 'AT', 1);
      if (mode === 'GET') {
        const code = list + '{' + at + '}';
        return [code, Matlab.ORDER_MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = getRemoveAt + '(' + list +', ' + at + ', 0)';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return getRemoveAt + '(' + list +', ' + at + ', 0);\n';
      }
      break;
    }
    case 'FROM_END': {
      let at = Matlab.getAdjustedInt(block, 'AT', 1, true);

      if (mode === 'GET') {
        const code = list + '{end+1' + at + '}';
        return [code, Matlab.ORDER_MEMBER];
      } else if (mode === 'GET_REMOVE') {
        const code = getRemoveAt + '(' + list +', ' + at + ', 0)';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return getRemoveAt + '(' + list +', ' + at + ', 0);\n';
      }
      break;
    }
    case 'RANDOM':
      if (mode === 'GET') {
        const code = getRemoveAt + '(' + list +', 0, 1)';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'GET_REMOVE') {
        const code = getRemoveAt + '(' + list +', 0, 0)';
        return [code, Matlab.ORDER_FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return getRemoveAt + '(' + list +', 0, 0);\n';
      }
      break;
  }
  throw Error('Unhandled combination (lists_getIndex).');
};

Matlab['lists_setIndex'] = function(block) {
  // Set element at index.
  let list = Matlab.valueToCode(block, 'LIST', Matlab.ORDER_MEMBER) || '{}';
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  let value = Matlab.valueToCode(block, 'TO', Matlab.ORDER_NONE) || '[]';
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

  value = 'flattentocelllist(' + value + ')';

  switch (where) {
    case 'FIRST':
      if (mode === 'SET') {
        return list + '(1) = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        return list + ' = [' + value + ', ' + list + '];\n';
      }
      break;
    case 'LAST':
      if (mode === 'SET') {
        return list + '(end) = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        return list + '(end+1) = ' + value + ';\n';
      }
      break;
    case 'FROM_START': {
      const at = Matlab.getAdjustedInt(block, 'AT', 1);
      if (mode === 'SET') {
        return list + '(' + at + ') = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        return list + ' = [' + list + '(1:' + at + '-1), ' + value + ', ' + list + '(' + at + ':end)];\n';
      }
      break;
    }
    case 'FROM_END': {
      const at = Matlab.getAdjustedInt(block, 'AT', 1, true);
      if (mode === 'SET') {
        return list + '(end+1' + at + ') = ' + value + ';\n';
      } else if (mode === 'INSERT') {
        return list + ' = [' + list + '(1:end+1' + at + '-1), ' + value + ', ' + list + '(end+1' + at + ':end)];\n';
      }
      break;
    }
    case 'RANDOM': {
      let code = cacheList();
      const xVar = Matlab.nameDB_.getDistinctName('tmp_x', NameType.VARIABLE);
      code += xVar + ' = randi(length(' + list + '));\n';
      if (mode === 'SET') {
        code += list + '(' + xVar + ') = ' + value + ';\n';
        return code;
      } else if (mode === 'INSERT') {
        code += list + ' = [' + list + '(1:' + xVar + '-1), ' + value + ', ' + list + '(' + xVar + ':end)];\n';
        return code;
      }
      break;
    }
  }
  throw Error('Unhandled combination (lists_setIndex).');
};

Matlab['lists_getSublist'] = function(block) {
  // Get sublist.
  const list = Matlab.valueToCode(block, 'LIST', Matlab.ORDER_MEMBER) || '{}';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = Matlab.getAdjustedInt(block, 'AT1', 1);
      if (at1 === 0) {
        at1 = '1';
      }
      break;
    case 'FROM_END':
      at1 = Matlab.getAdjustedInt(block, 'AT1', 1, true);
      at1 = 'end+1' + at1;
      break;
    case 'FIRST':
      at1 = '1';
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
      at2 = Matlab.getAdjustedInt(block, 'AT2', 1, true);
      // Ensure that if the result calculated is 0 that sub-sequence will
      // include all elements as expected.
      if (!stringUtils.isNumber(String(at2))) {
        at2 = 'end';
      } else if (at2 === 0) {
        at2 = 'end';
      } else {
        at2 = 'end+1' + at2;
      }
      break;
    case 'LAST':
      at2 = 'end';
      break;
    default:
      throw Error('Unhandled option (lists_getSublist)');
  }
  const code = list + '(' + at1 + ':' + at2 + ')';
  return [code, Matlab.ORDER_MEMBER];
};

Matlab['lists_sort'] = function(block) {
  // Block for sorting a list.
  const list = (Matlab.valueToCode(block, 'LIST', Matlab.ORDER_NONE) || '{}');
  const type = block.getFieldValue('TYPE');
  const reverse = block.getFieldValue('DIRECTION') === '1' ? 'ascend' : 'descend';
  const sortFunctionName = Matlab.provideFunction_('lists_sort', [
    'function sorted = ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(my_list, type, mode)\n' +
    '  switch(type)\n' +
    '    case \'TEXT\'\n' +
    '      sorted = sort(my_list, mode);\n' +
    '    case \'IGNORE_CASE\'\n' +
    '      [~, idx] = sort(lower(my_list), mode);\n' +
    '      sorted = my_list(idx);\n' +
    '    case \'NUMERIC\'\n' +
    '      [~, idx] = sort(cell2mat(my_list), mode);\n' +
    '      sorted = my_list(idx);\n' +
    '  end\n' +
    'end\n']);

  const code =
      sortFunctionName + '(' + list + ', \'' + type + '\', \'' + reverse + '\')';
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
    code = 'strsplit(' + value_input + ', ' + value_delim + ')';
  } else if (mode === 'JOIN') {
    const value_input =
        Matlab.valueToCode(block, 'INPUT', Matlab.ORDER_NONE) || '{}';
    const value_delim =
        Matlab.valueToCode(block, 'DELIM', Matlab.ORDER_MEMBER) || '\'\'';
    code = 'strjoin(' + value_input + ', ' + value_delim + ')';
  } else {
    throw Error('Unknown mode: ' + mode);
  }
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['lists_reverse'] = function(block) {
  // Block for reversing a list.
  const list = Matlab.valueToCode(block, 'LIST', Matlab.ORDER_NONE) || '{}';
  const code = 'flip(' + list + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};
