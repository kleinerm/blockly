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
 * @fileoverview Generating Matlab for procedure blocks.
 */
'use strict';

goog.module('Blockly.Matlab.procedures');

const Matlab = goog.require('Blockly.Matlab');
const Variables = goog.require('Blockly.Variables');
const {NameType} = goog.require('Blockly.Names');


Matlab['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.
  // First, add a 'global' statement for every variable that is not shadowed by
  // a local parameter.
  const globals = [];
  const workspace = block.workspace;
  const usedVariables = Variables.allUsedVarModels(workspace) || [];
  for (let i = 0, variable; (variable = usedVariables[i]); i++) {
    const varName = variable.name;
    if (block.getVars().indexOf(varName) === -1) {
      globals.push(Matlab.nameDB_.getName(varName, NameType.VARIABLE));
    }
  }
  // Add developer variables.
  const devVarList = Variables.allDeveloperVariables(workspace);
  for (let i = 0; i < devVarList.length; i++) {
    globals.push(
        Matlab.nameDB_.getName(devVarList[i], NameType.DEVELOPER_VARIABLE));
  }

  const globalString = globals.length ?
      Matlab.INDENT + 'global ' + globals.join(', ') + '\n' :
      '';
  const funcName =
      Matlab.nameDB_.getName(block.getFieldValue('NAME'), NameType.PROCEDURE);
  let xfix1 = '';
  if (Matlab.STATEMENT_PREFIX) {
    xfix1 += Matlab.injectId(Matlab.STATEMENT_PREFIX, block);
  }
  if (Matlab.STATEMENT_SUFFIX) {
    xfix1 += Matlab.injectId(Matlab.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = Matlab.prefixLines(xfix1, Matlab.INDENT);
  }
  let loopTrap = '';
  if (Matlab.INFINITE_LOOP_TRAP) {
    loopTrap = Matlab.prefixLines(
        Matlab.injectId(Matlab.INFINITE_LOOP_TRAP, block), Matlab.INDENT);
  }
  let branch = Matlab.statementToCode(block, 'STACK');
  let returnValue =
      Matlab.valueToCode(block, 'RETURN', Matlab.ORDER_NONE) || '';
  let xfix2 = '';
  if (branch && returnValue) {
    // After executing the function body, revisit this block for the return.
    xfix2 = xfix1;
  }
  if (returnValue) {
    returnValue = Matlab.INDENT + 'return ' + returnValue + '\n';
  } else if (!branch) {
    branch = Matlab.PASS;
  }
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = Matlab.nameDB_.getName(variables[i], NameType.VARIABLE);
  }
  let code = 'def ' + funcName + '(' + args.join(', ') + '):\n' + globalString +
      xfix1 + loopTrap + branch + xfix2 + returnValue;
  code = Matlab.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Matlab.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Matlab['procedures_defnoreturn'] = Matlab['procedures_defreturn'];

Matlab['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  const funcName =
      Matlab.nameDB_.getName(block.getFieldValue('NAME'), NameType.PROCEDURE);
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = Matlab.valueToCode(block, 'ARG' + i, Matlab.ORDER_NONE) || 'None';
  }
  const code = funcName + '(' + args.join(', ') + ')';
  return [code, Matlab.ORDER_FUNCTION_CALL];
};

Matlab['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  // Generated code is for a function call as a statement is the same as a
  // function call as a value, with the addition of line ending.
  const tuple = Matlab['procedures_callreturn'](block);
  return tuple[0] + '\n';
};

Matlab['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  const condition =
      Matlab.valueToCode(block, 'CONDITION', Matlab.ORDER_NONE) || 'False';
  let code = 'if ' + condition + ':\n';
  if (Matlab.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the return is triggered.
    code += Matlab.prefixLines(
        Matlab.injectId(Matlab.STATEMENT_SUFFIX, block), Matlab.INDENT);
  }
  if (block.hasReturnValue_) {
    const value =
        Matlab.valueToCode(block, 'VALUE', Matlab.ORDER_NONE) || 'None';
    code += Matlab.INDENT + 'return ' + value + '\n';
  } else {
    code += Matlab.INDENT + 'return\n';
  }
  return code;
};
