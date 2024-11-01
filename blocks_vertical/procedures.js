/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Procedure blocks for Scratch.
 */
'use strict';

goog.provide('Blockly.ScratchBlocks.ProcedureUtils');

goog.require('Blockly.Blocks');
goog.require('Blockly.Colours');
goog.require('Blockly.constants');
goog.require('Blockly.ScratchBlocks.VerticalExtensions');

// Serialization and deserialization.

/**
 * Create XML to represent the (non-editable) name and arguments of a procedure
 * call block.
 * @return {!Element} XML storage element.
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.callerMutationToDom = function() {
  var container = document.createElement('mutation');
  container.setAttribute('proccode', this.procCode_);
  container.setAttribute('argumentids', JSON.stringify(this.argumentIds_));
  container.setAttribute('warp', JSON.stringify(this.warp_));
  container.setAttribute('returns', JSON.stringify(this.output_));
  container.setAttribute('edited', JSON.stringify(this.edited));
  container.setAttribute('optype', JSON.stringify(this.outputType));
  container.setAttribute('color', JSON.stringify(this.color));
  container.innerText = this.image;
  return container;
};

/**
 * Parse XML to restore the (non-editable) name and arguments of a procedure
 * call block.
 * @param {!Element} xmlElement XML storage element.
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.callerDomToMutation = function(xmlElement) {
  this.procCode_ = xmlElement.getAttribute('proccode');
  this.generateShadows_ =
      JSON.parse(xmlElement.getAttribute('generateshadows'));
  this.argumentIds_ = JSON.parse(xmlElement.getAttribute('argumentids'));
  this.warp_ = JSON.parse(xmlElement.getAttribute('warp'));
  this.output_ = JSON.parse(xmlElement.getAttribute('returns'));
  this.edited = JSON.parse(xmlElement.getAttribute('edited'));
  this.outputType = JSON.parse(xmlElement.getAttribute('optype'));
  this.color = JSON.parse(xmlElement.getAttribute('color'));
  // compat bc dum poopoo code
  if (!this.color) this.color = [Blockly.Colours.more.primary, Blockly.Colours.more.secondary, Blockly.Colours.more.tertiary]
  if (this.color && this.color.primary) {
    this.color = [this.color.primary, this.color.secondary, this.color.tertiary]
  }
  // @todo figure out why the fuck we are even getting 8 digit hex colors in the first place
  this.color = this.color.map(c => c.slice(0, 7))
  this.image = xmlElement.innerText;
  this.updateDisplay_();
};

/**
 * Create XML to represent the (non-editable) name and arguments of a
 * procedures_prototype block or a procedures_declaration block.
 * @param {boolean=} opt_generateShadows Whether to include the generateshadows
 *     flag in the generated XML.  False if not provided.
 * @return {!Element} XML storage element.
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.definitionMutationToDom = function(
    opt_generateShadows) {
  var container = document.createElement('mutation');

  if (opt_generateShadows) {
    container.setAttribute('generateshadows', true);
  }
  container.setAttribute('proccode', this.procCode_);
  container.setAttribute('argumentids', JSON.stringify(this.argumentIds_));
  container.setAttribute('argumentnames', JSON.stringify(this.displayNames_));
  container.setAttribute('argumentdefaults', JSON.stringify(this.argumentDefaults_));
  container.setAttribute('warp', JSON.stringify(this.warp_));
  container.setAttribute('returns', JSON.stringify(this.output_));
  container.setAttribute('edited', JSON.stringify(this.edited));
  container.setAttribute('optype', JSON.stringify(this.outputType));
  container.setAttribute('color', JSON.stringify(this.color));
  container.innerText = this.image;
  return container;
};

/**
 * Parse XML to restore the (non-editable) name and arguments of a
 * procedures_prototype block or a procedures_declaration block.
 * @param {!Element} xmlElement XML storage element.
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.definitionDomToMutation = function(xmlElement) {
  this.procCode_ = xmlElement.getAttribute('proccode');
  this.warp_ = JSON.parse(xmlElement.getAttribute('warp'));

  var prevArgIds = this.argumentIds_;
  var prevDisplayNames = this.displayNames_;

  this.argumentIds_ = JSON.parse(xmlElement.getAttribute('argumentids'));
  this.displayNames_ = JSON.parse(xmlElement.getAttribute('argumentnames'));
  this.argumentDefaults_ = JSON.parse(xmlElement.getAttribute('argumentdefaults'));
  this.output_ = JSON.parse(xmlElement.getAttribute('returns'));
  this.outputType = JSON.parse(xmlElement.getAttribute('optype'));
  this.edited = JSON.parse(xmlElement.getAttribute('edited'));
  this.image = xmlElement.innerText;
  this.color = JSON.parse(xmlElement.getAttribute('color'));
  // compat bc dum poopoo code
  if (!this.color) this.color = [Blockly.Colours.more.primary, Blockly.Colours.more.secondary, Blockly.Colours.more.tertiary]
  if (this.color && this.color.primary) {
    this.color = [this.color.primary, this.color.secondary, this.color.tertiary]
  }
  // @todo figure out why the fuck we are even getting 8 digit hex colors in the first place
  this.color = this.color.map(c => c.slice(0, 7))
  this.image = xmlElement.innerText;
  this.updateDisplay_();
  if (this.updateArgumentReporterNames_) {
    this.updateArgumentReporterNames_(prevArgIds, prevDisplayNames);
  }
};

// End of serialization and deserialization.

// Shared by all three procedure blocks (procedures_declaration,
// procedures_call, and procedures_prototype).
/**
 * Returns the name of the procedure this block calls, or the empty string if
 * it has not yet been set.
 * @return {string} Procedure name.
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.getProcCode = function() {
  return this.procCode_;
};

/**
 * Update the block's structure and appearance to match the internally stored
 * mutation.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.updateDisplay_ = function() {
  var wasRendered = this.rendered;
  // @todo add statement check?
  var ConectionType = (this.outputType || (this.output_ ? 'string' : 'statement')).toLowerCase()
  this.rendered = false;

  var connectionMap = this.disconnectOldBlocks_();
  this.removeAllInputs_();

  this.createAllInputs_(connectionMap);
  this.deleteShadows_(connectionMap);
  this.setOutputShape(Blockly.OUTPUT_SHAPE_SQUARE);
  // only change the color if we have a color to change to
  this.setColour(...this.color)
  if (
      this.outputConnection && 
      this.outputConnection.targetConnection && 
      this.outputConnection.targetConnection.sourceBlock_.type === 'procedures_definition_return') {
    this.outputConnection.targetConnection.sourceBlock_.setColour(...this.color)
  }
  if (
      this.previousConnection && 
      this.previousConnection.targetConnection && 
      this.previousConnection.targetConnection.sourceBlock_.type === 'procedures_definition') {
    this.previousConnection.targetConnection.sourceBlock_.setColour(...this.color)
  }
  if (this.output_) {
    this.setPreviousStatement(false)
    this.setNextStatement(false)
    switch (ConectionType) {
      case 'string':
        this.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
        this.setOutput(this.output_, this.isDisplayOnly ? 'procedure' : 'String')
        break
      case 'number':
        this.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
        this.setOutput(this.output_, this.isDisplayOnly ? 'procedure' : 'Number')
        break
      case 'boolean':
        this.setOutputShape(Blockly.OUTPUT_SHAPE_HEXAGONAL);
        this.setOutput(this.output_, this.isDisplayOnly ? 'procedure' : 'Boolean')
        break
    }
  } else {
    this.setOutput(false)
    switch (ConectionType) {
      case 'statement':
        this.setPreviousStatement(!this.output_, this.isDisplayOnly ? 'procedure' : 'normal')
        this.setNextStatement(!this.output_, this.isDisplayOnly ? 'procedure' : 'normal')
        break
      case 'end':
        this.setPreviousStatement(!this.output_, this.isDisplayOnly ? 'procedure' : 'normal')
        this.setNextStatement(false, 'procedure')
        break
    }
  }

  this.rendered = wasRendered;
  if (wasRendered && !this.isInsertionMarker()) {
    this.initSvg();
    this.render();
  }
};

/**
 * Disconnect old blocks from all value inputs on this block, but hold onto them
 * in case they can be reattached later.  Also save the shadow DOM if it exists.
 * The result is a map from argument ID to information that was associated with
 * that argument at the beginning of the mutation.
 * @return {!Object.<string, {shadow: Element, block: Blockly.Block}>} An object
 *     mapping argument IDs to blocks and shadow DOMs.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.disconnectOldBlocks_ = function() {
  // Remove old stuff
  var connectionMap = {};
  for (var i = 0, input; input = this.inputList[i]; i++) {
    if (input.connection) {
      var target = input.connection.targetBlock();
      var saveInfo = {
        shadow: input.connection.getShadowDom(),
        block: target
      };
      connectionMap[input.name] = saveInfo;

      // Remove the shadow DOM, then disconnect the block.  Otherwise a shadow
      // block will respawn instantly, and we'd have to remove it when we remove
      // the input.
      input.connection.setShadowDom(null);
      if (target) {
        input.connection.disconnect();
      }
    }
  }
  return connectionMap;
};

/**
 * Remove all inputs on the block, including dummy inputs.
 * Assumes no input has shadow DOM set.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.removeAllInputs_ = function() {
  // Delete inputs directly instead of with block.removeInput to avoid splicing
  // out of the input list at every index.
  for (var i = 0, input; input = this.inputList[i]; i++) {
    input.dispose();
  }
  this.inputList = [];
};

Blockly.ScratchBlocks.ProcedureUtils.createIcon_ = function() {
  if (!this.image) return
  if (this.image.startsWith('data:') || this.image.startsWith('http')) {
    const iconField = new Blockly.FieldImage(this.image, 40, 40);
    const separatorField = new Blockly.FieldVerticalSeparator();
    this.appendDummyInput()
      .appendField(iconField)
      .appendField(separatorField);
  }
};

/**
 * Create all inputs specified by the new procCode, and populate them with
 * shadow blocks or reconnected old blocks as appropriate.
 * @param {!Object.<string, {shadow: Element, block: Blockly.Block}>}
 *     connectionMap An object mapping argument IDs to blocks and shadow DOMs.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.createAllInputs_ = function(connectionMap) {
  this.createIcon_()
  // Split the proc into components, by %n, %b, and %s (ignoring escaped).
  var procComponents = this.procCode_.split(/(?=[^\\]%[nsbc])/);
  procComponents = procComponents.map(function(c) {
    return c.trim(); // Strip whitespace.
  });
  // Create arguments and labels as appropriate.
  var argumentCount = 0;
  for (var i = 0, component; component = procComponents[i]; i++) {
    var labelText;
    var argumentType = component.substring(1, 2);
    var id = this.argumentIds_[argumentCount];
    // user error shouldnt literally nuke the app, ignore invalid markers instead of erroring on them
    if (component.substring(0, 1) == '%' && (['n', 's', 'b', 'c'].includes(argumentType)) && id) {
      /*
      if (!(argumentType == 'n' || argumentType == 'b' || argumentType == 's')) {
        throw new Error(
            'Found an custom procedure with an invalid type: ' + argumentType);
      }
      */
      labelText = component.substring(2).trim();

      if (argumentType == "c") {
        var input = this.appendStatementInput(id)
      } else {
        var input = this.appendValueInput(id);
      }
      if (argumentType == 'b') {
        input.setCheck('Boolean');
      }
      this.populateArgument_(argumentType, argumentCount, connectionMap, id,
          input);
      argumentCount++;
    } else {
      labelText = component.trim();
    }
    this.addProcedureLabel_(labelText.replace(/\\%/, '%'));
  }
};

/**
 * Delete all shadow blocks in the given map.
 * @param {!Object.<string, Blockly.Block>} connectionMap An object mapping
 *     argument IDs to the blocks that were connected to those IDs at the
 *     beginning of the mutation.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.deleteShadows_ = function(connectionMap) {
  // Get rid of all of the old shadow blocks if they aren't connected.
  if (connectionMap) {
    for (var id in connectionMap) {
      var saveInfo = connectionMap[id];
      if (saveInfo) {
        var block = saveInfo['block'];
        if (block && block.isShadow()) {
          block.dispose();
          connectionMap[id] = null;
          // At this point we know which shadow DOMs are about to be orphaned in
          // the VM.  What do we do with that information?
        }
      }
    }
  }
};
// End of shared code.

/**
 * Add a label field with the given text to a procedures_call or
 * procedures_prototype block.
 * @param {string} text The label text.
 * @private
 */
Blockly.ScratchBlocks.ProcedureUtils.addLabelField_ = function(text) {
  this.appendDummyInput().appendField(text);
};

/**
 * Add a label editor with the given text to a procedures_declaration
 * block.  Editing the text in the label editor updates the text of the
 * corresponding label fields on function calls.
 * @param {string} text The label text.
 * @private
 */
Blockly.ScratchBlocks.ProcedureUtils.addLabelEditor_ = function(text) {
  if (text) {
    this.appendDummyInput(Blockly.utils.genUid()).
        appendField(new Blockly.FieldTextInputRemovable(text));
  }
};

/**
 * Build a DOM node representing a shadow block of the given type.
 * @param {string} type One of 's' (string) or 'n' (number).
 * @return {!Element} The DOM node representing the new shadow block.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.buildShadowDom_ = function(type) {
  var shadowDom = goog.dom.createDom('shadow');
  if (type == 'n') {
    var shadowType = 'math_number';
    var fieldName = 'NUM';
    var fieldValue = '1';
  } else {
    var shadowType = 'text';
    var fieldName = 'TEXT';
    var fieldValue = '';
  }
  shadowDom.setAttribute('type', shadowType);
  var fieldDom = goog.dom.createDom('field', null, fieldValue);
  fieldDom.setAttribute('name', fieldName);
  shadowDom.appendChild(fieldDom);
  return shadowDom;
};

/**
 * Create a new shadow block and attach it to the given input.
 * @param {!Blockly.Input} input The value input to attach a block to.
 * @param {string} argumentType One of 'b' (boolean), 's' (string) or
 *     'n' (number).
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.attachShadow_ = function(input,
    argumentType) {
  if (argumentType == 'n' || argumentType == 's') {
    var blockType = argumentType == 'n' ? 'math_number' : 'text';
    Blockly.Events.disable();
    try {
      var newBlock = this.workspace.newBlock(blockType);
      if (argumentType == 'n') {
        newBlock.setFieldValue('1', 'NUM');
      } else {
        newBlock.setFieldValue('', 'TEXT');
      }
      newBlock.setShadow(true);
      if (!this.isInsertionMarker()) {
        newBlock.initSvg();
        newBlock.render(false);
      }
    } finally {
      Blockly.Events.enable();
    }
    if (Blockly.Events.isEnabled()) {
      Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
    }
    newBlock.outputConnection.connect(input.connection);
  }
};

/**
 * Create a new argument reporter block.
 * @param {string} argumentType One of 'b' (boolean), 's' (string) or
 *     'n' (number).
 * @param {string} displayName The name of the argument as provided by the
 *     user, which becomes the text of the label on the argument reporter block.
 * @return {!Blockly.BlockSvg} The newly created argument reporter block.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.createArgumentReporter_ = function(
    argumentType, displayName) {
  switch (argumentType) {
    case 'n':
    case 's':
      var blockType = 'argument_reporter_string_number';
      break;
    case 'b':
      var blockType = 'argument_reporter_boolean';
      break;
    case 'c':
      var blockType = 'argument_reporter_command';
      break;
  }
  Blockly.Events.disable();
  try {
    var newBlock = this.workspace.newBlock(blockType);
    newBlock.setShadow(true);
    newBlock.setFieldValue(displayName, 'VALUE');
    newBlock.color = this.color
    newBlock.setColour(...this.color)
    if (!this.isInsertionMarker()) {
      newBlock.initSvg();
      newBlock.render(false);
    }
  } finally {
    Blockly.Events.enable();
  }
  if (Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
  }
  return newBlock;
};

/**
 * Populate the argument by attaching the correct child block or shadow to the
 * given input.
 * @param {string} type One of 'b' (boolean), 's' (string) or 'n' (number).
 * @param {number} index The index of this argument into the argument id array.
 * @param {!Object.<string, {shadow: Element, block: Blockly.Block}>}
 *     connectionMap An object mapping argument IDs to blocks and shadow DOMs.
 * @param {string} id The ID of the input to populate.
 * @param {!Blockly.Input} input The newly created input to populate.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.populateArgumentOnCaller_ = function(type,
    index, connectionMap, id, input) {
  var oldBlock = null;
  var oldShadow = null;
  if (connectionMap && (id in connectionMap)) {
    var saveInfo = connectionMap[id];
    oldBlock = saveInfo['block'];
    oldShadow = saveInfo['shadow'];
  }

  if (connectionMap && oldBlock) {
    // Reattach the old block and shadow DOM.
    connectionMap[input.name] = null;
    if (type == "c") {
      oldBlock.previousConnection.connect(input.connection);
    } else {
      oldBlock.outputConnection.connect(input.connection);
    }
    if (type != 'b' && type != 'c' && this.generateShadows_) {
      var shadowDom = oldShadow || this.buildShadowDom_(type);
      console.log("setting shadow dom: " + shadowDom);
      input.connection.setShadowDom(shadowDom);
    }
  } else if (this.generateShadows_) {
    this.attachShadow_(input, type);
  }
};

/**
 * Populate the argument by attaching the correct argument reporter to the given
 * input.
 * @param {string} type One of 'b' (boolean), 's' (string) or 'n' (number).
 * @param {number} index The index of this argument into the argument ID and
 *     argument display name arrays.
 * @param {!Object.<string, {shadow: Element, block: Blockly.Block}>}
 *     connectionMap An object mapping argument IDs to blocks and shadow DOMs.
 * @param {string} id The ID of the input to populate.
 * @param {!Blockly.Input} input The newly created input to populate.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.populateArgumentOnPrototype_ = function(
    type, index, connectionMap, id, input) {
  var oldBlock = null;
  if (connectionMap && (id in connectionMap)) {
    var saveInfo = connectionMap[id];
    oldBlock = saveInfo['block'];
  }

  var oldTypeMatches =
    Blockly.ScratchBlocks.ProcedureUtils.checkOldTypeMatches_(oldBlock, type);
  var displayName = this.displayNames_[index];

  // Decide which block to attach.
  if (connectionMap && oldBlock && oldTypeMatches) {
    // Update the text if needed. The old argument reporter is the same type,
    // and on the same input, but the argument's display name may have changed.
    var argumentReporter = oldBlock;
    argumentReporter.setFieldValue(displayName, 'VALUE');
    connectionMap[input.name] = null;
  } else {
    var argumentReporter = this.createArgumentReporter_(type, displayName);
  }

  // Attach the block.
  if (type == "c") {
    input.connection.connect(argumentReporter.previousConnection);
  } else {
    input.connection.connect(argumentReporter.outputConnection);
  }
};

/**
 * Populate the argument by attaching the correct argument editor to the given
 * input.
 * @param {string} type One of 'b' (boolean), 's' (string) or 'n' (number).
 * @param {number} index The index of this argument into the argument id and
 *     argument display name arrays.
 * @param {!Object.<string, {shadow: Element, block: Blockly.Block}>}
 *     connectionMap An object mapping argument IDs to blocks and shadow DOMs.
 * @param {string} id The ID of the input to populate.
 * @param {!Blockly.Input} input The newly created input to populate.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.populateArgumentOnDeclaration_ = function(
    type, index, connectionMap, id, input) {

  var oldBlock = null;
  if (connectionMap && (id in connectionMap)) {
    var saveInfo = connectionMap[id];
    oldBlock = saveInfo['block'];
  }

  // TODO: This always returns false, because it checks for argument reporter
  // blocks instead of argument editor blocks.  Create a new version for argument
  // editors.
  var oldTypeMatches =
    Blockly.ScratchBlocks.ProcedureUtils.checkOldTypeMatches_(oldBlock, type);
  var displayName = this.displayNames_[index];

  // Decide which block to attach.
  if (oldBlock && oldTypeMatches) {
    var argumentEditor = oldBlock;
    oldBlock.setFieldValue(displayName, 'TEXT');
    connectionMap[input.name] = null;
  } else {
    var argumentEditor = this.createArgumentEditor_(type, displayName);
  }

  // Attach the block.
  if (type == "c") {
    input.connection.connect(argumentEditor.previousConnection);
  } else {
    input.connection.connect(argumentEditor.outputConnection);
  }
};

/**
 * Check whether the type of the old block corresponds to the given argument
 * type.
 * @param {Blockly.BlockSvg} oldBlock The old block to check.
 * @param {string} type The argument type.  One of 'n', 'n', or 's'.
 * @return {boolean} True if the type matches, false otherwise.
 */
Blockly.ScratchBlocks.ProcedureUtils.checkOldTypeMatches_ = function(oldBlock,
    type) {
  if (!oldBlock) {
    return false;
  }
  if ((type == 'n' || type == 's') &&
      oldBlock.type == 'argument_reporter_string_number') {
    return true;
  }
  if (type == 'b' && oldBlock.type == 'argument_reporter_boolean') {
    return true;
  }
  //dunno if this is needed but oh well
  if (type == 'c' && oldBlock.type == 'argument_reporter_command') {
    return true;
  }
  return false;
};

/**
 * Create an argument editor.
 * An argument editor is a shadow block with a single text field, which is used
 * to set the display name of the argument.
 * @param {string} argumentType One of 'b' (boolean), 's' (string) or
 *     'n' (number).
 * @param {string} displayName The display name  of this argument, which is the
 *     text of the field on the shadow block.
 * @return {!Blockly.BlockSvg} The newly created argument editor block.
 * @private
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.createArgumentEditor_ = function(
    argumentType, displayName) {
  Blockly.Events.disable();
  try {
    switch (argumentType) {
      case 'n':
      case 's':
        var newBlock = this.workspace.newBlock('argument_editor_string_number');
        break;
      case 'b':
        var newBlock = this.workspace.newBlock('argument_editor_boolean');
        break;
      case 'c':
        var newBlock = this.workspace.newBlock('argument_editor_command')
    }
    newBlock.setFieldValue(displayName, 'TEXT');
    newBlock.setShadow(true);
    if (!this.isInsertionMarker()) {
      newBlock.initSvg();
      newBlock.render(false);
    }
  } finally {
    Blockly.Events.enable();
  }
  if (Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
  }
  return newBlock;
};

/**
 * Update the serializable information on the block based on the existing inputs
 * and their text.
 */
Blockly.ScratchBlocks.ProcedureUtils.updateDeclarationProcCode_ = function() {
  this.procCode_ = '';
  this.displayNames_ = [];
  this.argumentIds_ = [];
  for (var i = 0; i < this.inputList.length; i++) {
    if (i != 0) {
      this.procCode_ += ' ';
    }
    var input = this.inputList[i];
    if (input.type == Blockly.DUMMY_INPUT) {
      this.procCode_ += input.fieldRow[0].getValue();
    } else if (input.type == Blockly.INPUT_VALUE || input.type == Blockly.NEXT_STATEMENT) {
      // Inspect the argument editor.
      var target = input.connection.targetBlock();
      this.displayNames_.push(target.getFieldValue('TEXT'));
      this.argumentIds_.push(input.name);
      switch (target.type) {
        case 'argument_editor_string_number':
          this.procCode_ += '%s';
          break;
        case 'argument_editor_boolean':
          this.procCode_ += '%b';
          break;
        case 'argument_editor_command':
          this.procCode_ += "%c";
          break;
      }
    } else {
      throw new Error(
          'Unexpected input type on a procedure mutator root: ' + input.type);
    }
  }
};

/**
 * Focus on the last argument editor or label editor on the block.
 * @private
 */
Blockly.ScratchBlocks.ProcedureUtils.focusLastEditor_ = function() {
  if (this.inputList.length > 0) {
    var newInput = this.inputList[this.inputList.length - 1];
    if (newInput.type == Blockly.DUMMY_INPUT) {
      newInput.fieldRow[0].showEditor_();
    } else if (newInput.type == Blockly.INPUT_VALUE) {
      // Inspect the argument editor.
      var target = newInput.connection.targetBlock();
      target.getField('TEXT').showEditor_();
    }
  }
};

/**
 * Externally-visible function to add a label to the procedure declaration.
 * @public
 */
Blockly.ScratchBlocks.ProcedureUtils.addLabelExternal = function() {
  Blockly.WidgetDiv.hide(true);
  this.procCode_ = this.procCode_ + ' label text';
  this.updateDisplay_();
  this.focusLastEditor_();
};

/**
 * Externally-visible function to add a boolean argument to the procedure
 * declaration.
 * @public
 */
Blockly.ScratchBlocks.ProcedureUtils.addBooleanExternal = function() {
  Blockly.WidgetDiv.hide(true);
  this.procCode_ = this.procCode_ + ' %b';
  this.displayNames_.push('boolean');
  this.argumentIds_.push(Blockly.utils.genUid());
  this.argumentDefaults_.push('false');
  this.updateDisplay_();
  this.focusLastEditor_();
};

Blockly.ScratchBlocks.ProcedureUtils.addCommandExternal = function () {
  Blockly.WidgetDiv.hide(true);
  this.procCode_ = this.procCode_ + " %c";
  this.displayNames_.push("branch");
  this.argumentIds_.push("SUBSTACK" + Blockly.utils.genUid());
  this.argumentDefaults_.push("");
  this.updateDisplay_();
  this.focusLastEditor_();
};

/**
 * Externally-visible function to add a string/number argument to the procedure
 * declaration.
 * @public
 */
Blockly.ScratchBlocks.ProcedureUtils.addStringNumberExternal = function() {
  Blockly.WidgetDiv.hide(true);
  this.procCode_ = this.procCode_ + ' %s';
  this.displayNames_.push('number or text');
  this.argumentIds_.push(Blockly.utils.genUid());
  this.argumentDefaults_.push('');
  this.updateDisplay_();
  this.focusLastEditor_();
};

/**
 * Externally-visible function to get the warp on procedure declaration.
 * @return {boolean} The value of the warp_ property.
 * @public
 */
Blockly.ScratchBlocks.ProcedureUtils.getWarp = function() {
  return this.warp_;
};

Blockly.ScratchBlocks.ProcedureUtils.getReturns = function() {
  return this.output_;
};

Blockly.ScratchBlocks.ProcedureUtils.getEdited = function() {
  return this.edited;
}

Blockly.ScratchBlocks.ProcedureUtils.setEdited = function(edited) {
  this.edited = edited;
}

Blockly.ScratchBlocks.ProcedureUtils.setReturns = function(returns) {
  this.output_ = returns;
  this.updateDisplay_();
};

Blockly.ScratchBlocks.ProcedureUtils.setType = function(type) {
  this.outputType = type.toLowerCase()
  this.updateDisplay_();
}

Blockly.ScratchBlocks.ProcedureUtils.setImage = function(image) {
  this.image = image
  this.updateDisplay_();
}

Blockly.ScratchBlocks.ProcedureUtils.unsetImage = function() {
  this.image = ''
  this.updateDisplay_();
}

Blockly.ScratchBlocks.ProcedureUtils.setColor = function(primary, secondary, tertiary) {
  this.color = [primary, secondary, tertiary]
  this.updateDisplay_();
}

Blockly.ScratchBlocks.ProcedureUtils.removeColor = function() {
  this.color = [Blockly.Colours.more.primary, Blockly.Colours.more.secondary, Blockly.Colours.more.tertiary]
  this.updateDisplay_();
}

/**
 * Externally-visible function to set the warp on procedure declaration.
 * @param {boolean} warp The value of the warp_ property.
 * @public
 */
Blockly.ScratchBlocks.ProcedureUtils.setWarp = function(warp) {
  this.warp_ = warp;
};

/**
 * Callback to remove a field, only for the declaration block.
 * @param {Blockly.Field} field The field being removed.
 * @public
 */
Blockly.ScratchBlocks.ProcedureUtils.removeFieldCallback = function(field) {
  // Do not delete if there is only one input
  if (this.inputList.length === 1) {
    return;
  }
  var inputNameToRemove = null;
  for (var n = 0; n < this.inputList.length; n++) {
    var input = this.inputList[n];
    if (input.connection) {
      var target = input.connection.targetBlock();
      if (target.getField(field.name) == field) {
        inputNameToRemove = input.name;
      }
    } else {
      for (var j = 0; j < input.fieldRow.length; j++) {
        if (input.fieldRow[j] == field) {
          inputNameToRemove = input.name;
        }
      }
    }
  }
  if (inputNameToRemove) {
    Blockly.WidgetDiv.hide(true);
    this.removeInput(inputNameToRemove);
    this.onChangeFn();
    this.updateDisplay_();
  }
};

/**
 * Callback to pass removeField up to the declaration block from arguments.
 * @param {Blockly.Field} field The field being removed.
 * @public
 */
Blockly.ScratchBlocks.ProcedureUtils.removeArgumentCallback_ = function(field) {
  if (this.parentBlock_ && this.parentBlock_.removeFieldCallback) {
    this.parentBlock_.removeFieldCallback(field);
  }
};

/**
 * Update argument reporter field values after an edit to the prototype mutation
 * using previous argument ids and names.
 * Because the argument reporters only store names and not which argument ids they
 * are linked to, it would not be safe to update all argument reporters on the workspace
 * since they may be argument reporters with the same name from a different procedure.
 * Until there is a more explicit way of identifying argument reporter blocks using ids,
 * be conservative and only update argument reporters that are used in the
 * stack below the prototype, ie the definition.
 * @param {!Array<string>} prevArgIds The previous ordering of argument ids.
 * @param {!Array<string>} prevDisplayNames The previous argument names.
 * @this Blockly.Block
 */
Blockly.ScratchBlocks.ProcedureUtils.updateArgumentReporterNames_ = function(prevArgIds, prevDisplayNames) {
  var nameChanges = [];
  var argReporters = [];
  var definitionBlock = this.getParent();
  if (!definitionBlock) return;

  // Create a list of argument reporters that are descendants of the definition stack (see above comment)
  var allBlocks = definitionBlock.getDescendants(false);
  for (var i = 0; i < allBlocks.length; i++) {
    var block = allBlocks[i];
    if ((block.type === 'argument_reporter_string_number' ||
        block.type === 'argument_reporter_boolean' ||
        block.type === 'argument_reporter_command') &&
        !block.isShadow()) { // Exclude arg reporters in the prototype block, which are shadows.
      argReporters.push(block);
    }
  }

  // Create a list of "name changes", including the new name and blocks matching the old name
  // Only search over the current set of argument ids, ignore args that have been removed
  for (var i = 0, id; id = this.argumentIds_[i]; i++) {
    // Find the previous index of this argument id. Could be -1 if it is newly added.
    var prevIndex = prevArgIds.indexOf(id);
    if (prevIndex == -1) continue; // Newly added argument, no corresponding previous argument to update.
    var prevName = prevDisplayNames[prevIndex];
    if (prevName != this.displayNames_[i]) {
      nameChanges.push({
        newName: this.displayNames_[i],
        blocks: argReporters.filter(function(block) {
          return block.getFieldValue('VALUE') == prevName;
        })
      });
    }
  }

  // Finally update the blocks for each name change.
  // Do this after creating the lists to avoid cycles of renaming.
  for (var j = 0, nameChange; nameChange = nameChanges[j]; j++) {
    for (var k = 0, block; block = nameChange.blocks[k]; k++) {
      block.setFieldValue(nameChange.newName, 'VALUE');
    }
  }
};

Blockly.ScratchBlocks.ProcedureUtils.argumentReporterMutationToDom = function() {
  var dom = document.createElement('mutation');
  dom.setAttribute('color', JSON.stringify(this.color))
  return dom
};

Blockly.ScratchBlocks.ProcedureUtils.argumentReporterDomToMutation = function(dom) {
  try {
    this.color = JSON.parse(dom.getAttribute('color'))
    this.updateDisplay_()
  } catch (err) {
    console.warn('unknown old argument reporter')
  }
};

Blockly.ScratchBlocks.ProcedureUtils.argumentReporterUpdateDisplay = function(dom) {
  this.setColour(...this.color)
};

Blockly.Blocks['procedures_definition'] = {
  /**
   * Block for defining a procedure with no return value.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "message0": Blockly.Msg.PROCEDURES_DEFINITION,
      "args0": [
        {
          "type": "input_statement",
          "name": "custom_block",
          "check": 'procedure'
        }
      ],
      "extensions": ["colours_more", "shape_hat", "procedure_def_contextmenu"]
    });
  }
};

Blockly.Blocks['procedures_definition_return'] = {
  /**
   * Block for defining a procedure with no return value.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "message0": Blockly.Msg.PROCEDURES_DEFINITION,
      "args0": [
        {
          "type": "input_value",
          "name": "custom_block",
          "check": 'procedure'
        }
      ],
      "extensions": ["colours_more", "shape_hat", "procedure_def_contextmenu"]
    });
  }
};

Blockly.Blocks['procedures_call'] = {
  /**
   * Block for calling a procedure with no return value.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "extensions": ["colours_more", "shape_statement", "procedure_call_contextmenu"]
    });
    this.procCode_ = '';
    this.argumentIds_ = [];
    this.warp_ = false;
    this.output_ = false;
    this.isDisplayOnly = false
    this.edited = false
    this.outputType = 'statement'
    this.image = ''
    this.color = [Blockly.Colours.more.primary, Blockly.Colours.more.secondary, Blockly.Colours.more.tertiary]
  },
  // Shared.
  getProcCode: Blockly.ScratchBlocks.ProcedureUtils.getProcCode,
  removeAllInputs_: Blockly.ScratchBlocks.ProcedureUtils.removeAllInputs_,
  disconnectOldBlocks_: Blockly.ScratchBlocks.ProcedureUtils.disconnectOldBlocks_,
  deleteShadows_: Blockly.ScratchBlocks.ProcedureUtils.deleteShadows_,
  createIcon_: Blockly.ScratchBlocks.ProcedureUtils.createIcon_,
  createAllInputs_: Blockly.ScratchBlocks.ProcedureUtils.createAllInputs_,
  updateDisplay_: Blockly.ScratchBlocks.ProcedureUtils.updateDisplay_,

  // Exist on all three blocks, but have different implementations.
  mutationToDom: Blockly.ScratchBlocks.ProcedureUtils.callerMutationToDom,
  domToMutation: Blockly.ScratchBlocks.ProcedureUtils.callerDomToMutation,
  populateArgument_: Blockly.ScratchBlocks.ProcedureUtils.populateArgumentOnCaller_,
  addProcedureLabel_: Blockly.ScratchBlocks.ProcedureUtils.addLabelField_,

  // Only exists on the external caller.
  attachShadow_: Blockly.ScratchBlocks.ProcedureUtils.attachShadow_,
  buildShadowDom_: Blockly.ScratchBlocks.ProcedureUtils.buildShadowDom_
};

Blockly.Blocks['procedures_prototype'] = {
  /**
   * Block for calling a procedure with no return value, for rendering inside
   * define block.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "extensions": ["colours_more", 'shape_procedure']
    });

    /* Data known about the procedure. */
    this.procCode_ = '';
    this.displayNames_ = [];
    this.argumentIds_ = [];
    this.argumentDefaults_ = [];
    this.warp_ = false;
    this.output_ = false;
    this.isDisplayOnly = true
    this.edited = false
    this.outputType = 'statement'
    this.image = ''
    this.color = [Blockly.Colours.more.primary, Blockly.Colours.more.secondary, Blockly.Colours.more.tertiary]
  },
  // Shared.
  getProcCode: Blockly.ScratchBlocks.ProcedureUtils.getProcCode,
  removeAllInputs_: Blockly.ScratchBlocks.ProcedureUtils.removeAllInputs_,
  disconnectOldBlocks_: Blockly.ScratchBlocks.ProcedureUtils.disconnectOldBlocks_,
  deleteShadows_: Blockly.ScratchBlocks.ProcedureUtils.deleteShadows_,
  createIcon_: Blockly.ScratchBlocks.ProcedureUtils.createIcon_,
  createAllInputs_: Blockly.ScratchBlocks.ProcedureUtils.createAllInputs_,
  updateDisplay_: Blockly.ScratchBlocks.ProcedureUtils.updateDisplay_,

  // Exist on all three blocks, but have different implementations.
  mutationToDom: Blockly.ScratchBlocks.ProcedureUtils.definitionMutationToDom,
  domToMutation: Blockly.ScratchBlocks.ProcedureUtils.definitionDomToMutation,
  populateArgument_: Blockly.ScratchBlocks.ProcedureUtils.populateArgumentOnPrototype_,
  addProcedureLabel_: Blockly.ScratchBlocks.ProcedureUtils.addLabelField_,

  // Only exists on procedures_prototype.
  createArgumentReporter_: Blockly.ScratchBlocks.ProcedureUtils.createArgumentReporter_,
  updateArgumentReporterNames_: Blockly.ScratchBlocks.ProcedureUtils.updateArgumentReporterNames_
};

Blockly.Blocks['procedures_declaration'] = {
  /**
   * The root block in the procedure declaration editor.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "extensions": ["colours_more", 'shape_procedure']
    });
    /* Data known about the procedure. */
    this.procCode_ = '';
    this.displayNames_ = [];
    this.argumentIds_ = [];
    this.argumentDefaults_ = [];
    this.warp_ = false;
    this.output_ = false;
    this.isDisplayOnly = true
    this.edited = false
    this.outputType = 'statement'
    this.image = ''
    this.color = [Blockly.Colours.more.primary, Blockly.Colours.more.secondary, Blockly.Colours.more.tertiary]
  },
  // Shared.
  getProcCode: Blockly.ScratchBlocks.ProcedureUtils.getProcCode,
  removeAllInputs_: Blockly.ScratchBlocks.ProcedureUtils.removeAllInputs_,
  disconnectOldBlocks_: Blockly.ScratchBlocks.ProcedureUtils.disconnectOldBlocks_,
  deleteShadows_: Blockly.ScratchBlocks.ProcedureUtils.deleteShadows_,
  createIcon_: Blockly.ScratchBlocks.ProcedureUtils.createIcon_,
  createAllInputs_: Blockly.ScratchBlocks.ProcedureUtils.createAllInputs_,
  updateDisplay_: Blockly.ScratchBlocks.ProcedureUtils.updateDisplay_,

  // Exist on all three blocks, but have different implementations.
  mutationToDom: Blockly.ScratchBlocks.ProcedureUtils.definitionMutationToDom,
  domToMutation: Blockly.ScratchBlocks.ProcedureUtils.definitionDomToMutation,
  populateArgument_: Blockly.ScratchBlocks.ProcedureUtils.populateArgumentOnDeclaration_,
  addProcedureLabel_: Blockly.ScratchBlocks.ProcedureUtils.addLabelEditor_,

  // Exist on declaration and arguments editors, with different implementations.
  removeFieldCallback: Blockly.ScratchBlocks.ProcedureUtils.removeFieldCallback,

  // Only exist on procedures_declaration.
  createArgumentEditor_: Blockly.ScratchBlocks.ProcedureUtils.createArgumentEditor_,
  focusLastEditor_: Blockly.ScratchBlocks.ProcedureUtils.focusLastEditor_,
  getWarp: Blockly.ScratchBlocks.ProcedureUtils.getWarp,
  setWarp: Blockly.ScratchBlocks.ProcedureUtils.setWarp,
  getReturns: Blockly.ScratchBlocks.ProcedureUtils.getReturns,
  setReturns: Blockly.ScratchBlocks.ProcedureUtils.setReturns,
  getEdited: Blockly.ScratchBlocks.ProcedureUtils.getEdited,
  setEdited: Blockly.ScratchBlocks.ProcedureUtils.setEdited,
  setType: Blockly.ScratchBlocks.ProcedureUtils.setType,
  setImage: Blockly.ScratchBlocks.ProcedureUtils.setImage,
  unsetImage: Blockly.ScratchBlocks.ProcedureUtils.unsetImage,
  setColor: Blockly.ScratchBlocks.ProcedureUtils.setColor,
  removeColor: Blockly.ScratchBlocks.ProcedureUtils.removeColor,
  addLabelExternal: Blockly.ScratchBlocks.ProcedureUtils.addLabelExternal,
  addBooleanExternal: Blockly.ScratchBlocks.ProcedureUtils.addBooleanExternal,
  addCommandExternal: Blockly.ScratchBlocks.ProcedureUtils.addCommandExternal,
  addStringNumberExternal: Blockly.ScratchBlocks.ProcedureUtils.addStringNumberExternal,
  onChangeFn: Blockly.ScratchBlocks.ProcedureUtils.updateDeclarationProcCode_
};

Blockly.Blocks['argument_reporter_boolean'] = {
  init: function() {
    this.jsonInit({ 
      "message0": " %1",
      "args0": [
        {
          "type": "field_label_serializable",
          "name": "VALUE",
          "text": ""
        }
      ],
      "extensions": ["colours_more", "output_boolean"]
    });
  },
  updateDisplay_: Blockly.ScratchBlocks.ProcedureUtils.argumentReporterUpdateDisplay,
  mutationToDom: Blockly.ScratchBlocks.ProcedureUtils.argumentReporterMutationToDom,
  domToMutation: Blockly.ScratchBlocks.ProcedureUtils.argumentReporterDomToMutation
};

Blockly.Blocks['argument_reporter_string_number'] = {
  init: function() {
    this.jsonInit({ 
      "message0": " %1",
      "args0": [
        {
          "type": "field_label_serializable",
          "name": "VALUE",
          "text": ""
        }
      ],
      "extensions": ["colours_more", "output_number", "output_string"]
    });
  },
  updateDisplay_: Blockly.ScratchBlocks.ProcedureUtils.argumentReporterUpdateDisplay,
  mutationToDom: Blockly.ScratchBlocks.ProcedureUtils.argumentReporterMutationToDom,
  domToMutation: Blockly.ScratchBlocks.ProcedureUtils.argumentReporterDomToMutation
};

Blockly.Blocks['argument_reporter_command'] = {
  init: function () {
    this.jsonInit({ "message0": " %1",
      "args0": [
        {
          "type": "field_label_serializable",
          "name": "VALUE",
          "text": ""
        }
      ],
      "canDragDuplicate": true,
      "extensions": ["colours_more", "shape_statement"],
    });
  },
  updateDisplay_: Blockly.ScratchBlocks.ProcedureUtils.argumentReporterUpdateDisplay,
  mutationToDom: Blockly.ScratchBlocks.ProcedureUtils.argumentReporterMutationToDom,
  domToMutation: Blockly.ScratchBlocks.ProcedureUtils.argumentReporterDomToMutation
};

Blockly.Blocks['argument_editor_boolean'] = {
  init: function() {
    this.jsonInit({ "message0": " %1",
      "args0": [
        {
          "type": "field_input_removable",
          "name": "TEXT",
          "text": "foo"
        }
      ],
      "colour": Blockly.Colours.textField,
      "colourSecondary": Blockly.Colours.textField,
      "colourTertiary": Blockly.Colours.textField,
      "colourQuaternary": Blockly.Colours.textField,
      "extensions": ["output_boolean"]
    });
  },
  // Exist on declaration and arguments editors, with different implementations.
  removeFieldCallback: Blockly.ScratchBlocks.ProcedureUtils.removeArgumentCallback_
};

Blockly.Blocks['argument_editor_string_number'] = {
  init: function() {
    this.jsonInit({ "message0": " %1",
      "args0": [
        {
          "type": "field_input_removable",
          "name": "TEXT",
          "text": "foo"
        }
      ],
      "colour": Blockly.Colours.textField,
      "colourSecondary": Blockly.Colours.textField,
      "colourTertiary": Blockly.Colours.textField,
      "colourQuaternary": Blockly.Colours.textField,
      "extensions": ["output_number", "output_string"]
    });
  },
  // Exist on declaration and arguments editors, with different implementations.
  removeFieldCallback: Blockly.ScratchBlocks.ProcedureUtils.removeArgumentCallback_
};

Blockly.Blocks['argument_editor_command'] = {
  init: function () {
    this.jsonInit({ "message0": " %1",
      "args0": [
        {
          "type": "field_input_removable",
          "name": "TEXT",
          "text": "foo"
        }
      ],
      "colour": Blockly.Colours.textField,
      "colourSecondary": Blockly.Colours.textField,
      "colourTertiary": Blockly.Colours.textField,
      "colourQuaternary": Blockly.Colours.textField,
      "extensions": ["colours_more", "shape_statement"],
    });
  },
  // Exist on declaration and arguments editors, with different implementations.
  removeFieldCallback: Blockly.ScratchBlocks.ProcedureUtils.removeArgumentCallback_,
};

Blockly.Blocks['procedures_set'] = {
  init: function() {
    this.jsonInit({
      "message0": 'set %1 to %2',
      "args0": [
        {
          "type": "input_value",
          "name": "PARAM"
        },
        {
          "type": "input_value",
          "name": "VALUE"
        }
      ],
      "extensions": ["colours_more", "shape_statement"]
    });
  }
};

Blockly.Blocks['procedures_return'] = {
  init: function() {
    this.jsonInit({
      "message0": 'return %1',
      "args0": [
        {
          "type": "input_value",
          "name": "return"
        }
      ],
      "extensions": ["colours_more", "shape_end"]
    });
  }
};
