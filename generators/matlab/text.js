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
 * @fileoverview Generating Matlab for text blocks.
 */
'use strict';

goog.module('Blockly.Matlab.texts');

const Matlab = goog.require('Blockly.Matlab');
const stringUtils = goog.require('Blockly.utils.string');
const {NameType} = goog.require('Blockly.Names');


Matlab['text'] = function(block) {
  // Text value.
  const code = Matlab.quote_(block.getFieldValue('TEXT'));
  return [code, Matlab.ORDER_ATOMIC];
};

Matlab['text_multiline'] = function(block) {
  // Text value.
  const code = Matlab.multiline_quote_(block.getFieldValue('TEXT'));
  const order =
      code.indexOf('+') !== -1 ? Matlab.ORDER_ADDITIVE : Matlab.ORDER_ATOMIC;
  return [code, order];
};

/**
 * Regular expression to detect a single-quoted string literal.
 */
const strRegExp = /^\s*'([^']|\\')*'\s*$/;

/**
 * Enclose the provided value in 'char(...)' function.
 * Leave string literals alone.
 * @param {string} value Code evaluating to a value.
 * @return {Array<string|number>} Array containing code evaluating to a string
 *     and
 *    the order of the returned code.[string, number]
 */
const forceString = function(value) {
  if (strRegExp.test(value)) {
    return [value, Matlab.ORDER_ATOMIC];
  }
  return ['char(' + value + ')', Matlab.ORDER_FUNCTION_CALL];
};

Matlab['text_join'] = function(block) {
  // Create a string made up of any number of elements of any type.
  // Should we allow joining by '-' or ',' or any other characters? TODO
  switch (block.itemCount_) {
    case 0:
      return ['\'\'', Matlab.ORDER_ATOMIC];
    case 1: {
      const element =
          Matlab.valueToCode(block, 'ADD0', Matlab.ORDER_NONE) || '\'\'';
      const codeAndOrder = forceString(element);
      return codeAndOrder;
    }
    case 2: {
      const element0 =
          Matlab.valueToCode(block, 'ADD0', Matlab.ORDER_NONE) || '\'\'';
      const element1 =
          Matlab.valueToCode(block, 'ADD1', Matlab.ORDER_NONE) || '\'\'';
      const code = '[ ' + forceString(element0)[0] + ' , ' + forceString(element1)[0] + ' ]';
      return [code, Matlab.ORDER_ADDITIVE];
    }
    default: {
      const elements = [];
      for (let i = 0; i < block.itemCount_; i++) {
        elements[i] =
            Matlab.valueToCode(block, 'ADD' + i, Matlab.ORDER_NONE) || '\'\'';
      }
      const tempVar = Matlab.nameDB_.getDistinctName('x', NameType.VARIABLE);
      const code = '[' + elements.join(', ') + ']';
      return [code, Matlab.ORDER_FUNCTION_CALL];
    }
  }
};

Matlab['text_append'] = function(block) {
  // Append to a variable in place.
  const varName =
      Matlab.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  const value = Matlab.valueToCode(block, 'TEXT', Matlab.ORDER_NONE) || '\'\'';
  return varName + ' = [char(' + varName + ') , ' + forceString(value)[0] + '];\n';
};

Matlab['text_length'] = function(block) {
  // Is the string null or array empty?
  const text = Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '\'\'';
  return ['length(' + text + ')', Matlab.ORDER_FUNCTION_CALL];
};

Matlab['text_isEmpty'] = function(block) {
  // Is the string null or array empty?
  const text = Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || '\'\'';
  const code = 'isempty(' + text + ')';
  return [code, Matlab.ORDER_LOGICAL_NOT];
};

Matlab['text_indexOf'] = function(block) {
  // Search the text for a substring.
  // Should we allow for non-case sensitive???
  const operator = block.getFieldValue('END') === 'FIRST' ? 'min' : 'max';
  const substring =
      Matlab.valueToCode(block, 'FIND', Matlab.ORDER_NONE) || '\'\'';
  const text =
      Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_MEMBER) || '\'\'';
  const code = operator + '(strfind(' + text + ', ' + substring + ', \'overlaps\', false))';
  //if (block.workspace.options.oneBasedIndex) {
  //  return [code + ' + 1', Matlab.ORDER_ADDITIVE];
  //}
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['text_charAt'] = function(block) {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const textOrder =
      (where === 'RANDOM') ? Matlab.ORDER_NONE : Matlab.ORDER_MEMBER;
  const text = Matlab.valueToCode(block, 'VALUE', textOrder) || '\'\'';
  switch (where) {
    case 'FIRST': {
      const code = text + '(1)';
      return [code, Matlab.ORDER_MEMBER];
    }
    case 'LAST': {
      const code = text + '(end)';
      return [code, Matlab.ORDER_MEMBER];
    }
    case 'FROM_START': {
      const at = Matlab.getAdjustedInt(block, 'AT', 1);
      const code = text + '(' + at + ')';
      return [code, Matlab.ORDER_MEMBER];
    }
    case 'FROM_END': {
      let at = Matlab.getAdjustedInt(block, 'AT', 0, true);
      // Ensure that if the result calculated is 0 that sub-sequence will
      // include all elements as expected.
      if (!stringUtils.isNumber(String(at))) {
        at += 'end';
      } else if (at === 0) {
        at = 'end';
      }
      else {
        at = 'end' + at;
      }
      const code = text + '(' + at + ')';
      return [code, Matlab.ORDER_MEMBER];
    }
    case 'RANDOM': {
      const code = text + '(randi(length(' + text + ')))';
      return [code, Matlab.ORDER_FUNCTION_CALL];
    }
  }
  throw Error('Unhandled option (text_charAt).');
};

Matlab['text_getSubstring'] = function(block) {
  // Get substring.
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  const text =
      Matlab.valueToCode(block, 'STRING', Matlab.ORDER_MEMBER) || '\'\'';
  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = Matlab.getAdjustedInt(block, 'AT1', 1);
      if (at1 === 0) {
        at1 = '1';
      }
      break;
    case 'FROM_END':
      at1 = Matlab.getAdjustedInt(block, 'AT1', 0, true);
      // Ensure that if the result calculated is 0 that sub-sequence will
      // include all elements as expected.
      if (!stringUtils.isNumber(String(at1))) {
        at1 += 'end';
      } else if (at1 === 0) {
        at1 = 'end';
      }
      else {
        at1 = 'end' + at1;
      }
      break;
    case 'FIRST':
      at1 = '1';
      break;
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }

  let at2;
  switch (where2) {
    case 'FROM_START':
      at2 = Matlab.getAdjustedInt(block, 'AT2', 1);
      if (at2 === 0) {
        at2 = '1';
      }
      break;
    case 'FROM_END':
      at2 = Matlab.getAdjustedInt(block, 'AT2', 0, true);
      // Ensure that if the result calculated is 0 that sub-sequence will
      // include all elements as expected.
      if (!stringUtils.isNumber(String(at2))) {
        at2 += 'end';
      } else if (at2 === 0) {
        at2 = 'end';
      }
      else {
        at2 = 'end' + at2;
      }
      break;
    case 'LAST':
      at2 = 'end';
      break;
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }
  const code = text + '(' + at1 + ':' + at2 + ')';
  return [code, Matlab.ORDER_MEMBER];
};

Matlab['text_changeCase'] = function(block) {
  // Change capitalization.
  const OPERATORS = {
    'UPPERCASE': 'upper(',
    'LOWERCASE': 'lower(',
    'TITLECASE': 'totitlecase('
  };
  const operator = OPERATORS[block.getFieldValue('CASE')];

  if (block.getFieldValue('CASE') === 'TITLECASE') {
    const functionName = Matlab.provideFunction_('totitlecase', [
        'function outtext = ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(intext)\n' +
        Matlab.INDENT + 'doit = logical([1 isspace(intext)(1:end-1)]);\n' +
        Matlab.INDENT + 'outtext = lower(intext); outtext(doit) = upper(intext(doit));\n' +
        'end']);
  }

  const text = Matlab.valueToCode(block, 'TEXT', Matlab.ORDER_MEMBER) || '\'\'';
  const code = operator + text + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['text_trim'] = function(block) {
  // Trim spaces.
  const OPERATORS = {
    'LEFT': 'lstrip(',
    'RIGHT': 'deblank(',
    'BOTH': 'strtrim('
  };
  const operator = OPERATORS[block.getFieldValue('MODE')];
  const text = Matlab.valueToCode(block, 'TEXT', Matlab.ORDER_MEMBER) || '\'\'';
  if (block.getFieldValue('MODE') === 'LEFT') {
    const functionName = Matlab.provideFunction_('lstrip', [
        'function outtext = ' + Matlab.FUNCTION_NAME_PLACEHOLDER_ + '(intext)\n' +
        Matlab.INDENT + 'outtext = intext(min(find(~isspace(intext))):end);\n' +
        'end']);
  }

  const code = operator + text + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['text_print'] = function(block) {
  // Print statement.
  const msg = Matlab.valueToCode(block, 'TEXT', Matlab.ORDER_NONE) || '\'\'';
  return 'disp(' + msg + ');\n';
};

Matlab['text_prompt_ext'] = function(block) {
  // Prompt function.
  let msg;
  if (block.getField('TEXT')) {
    // Internal message.
    msg = Matlab.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    msg = Matlab.valueToCode(block, 'TEXT', Matlab.ORDER_NONE) || '\'\'';
  }

  let code = 'input(' + msg + ', \'s\')';
  const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
  if (toNumber) {
    code = 'str2num(' + code + ')';
  }
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['text_prompt'] = Matlab['text_prompt_ext'];

Matlab['text_count'] = function(block) {
  const text = Matlab.valueToCode(block, 'TEXT', Matlab.ORDER_MEMBER) || '\'\'';
  const sub = Matlab.valueToCode(block, 'SUB', Matlab.ORDER_NONE) || '\'\'';
  const code = 'length(strfind(' + text + ', ' + sub + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['text_replace'] = function(block) {
  const text = Matlab.valueToCode(block, 'TEXT', Matlab.ORDER_MEMBER) || '\'\'';
  const from = Matlab.valueToCode(block, 'FROM', Matlab.ORDER_NONE) || '\'\'';
  const to = Matlab.valueToCode(block, 'TO', Matlab.ORDER_NONE) || '\'\'';
  const code = 'strrep(' + text + ', ' + from + ', ' + to + ', \'overlaps\', false)';
  return [code, Matlab.ORDER_MEMBER];
};

Matlab['text_reverse'] = function(block) {
  const text = Matlab.valueToCode(block, 'TEXT', Matlab.ORDER_MEMBER) || '\'\'';
  const code = text + '(end:-1:1)';
  return [code, Matlab.ORDER_MEMBER];
};
