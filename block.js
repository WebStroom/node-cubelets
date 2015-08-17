var BlockTypes = require('./blockTypes')
var __ = require('underscore')

var Block = function (blockId, hopCount, blockType) {
  var _blockId = blockId

  // Protected values, updated by the client as it
  // receives more information about the block.
  this._hopCount = hopCount
  this._blockType = blockType || BlockTypes.UNKNOWN
  this._neighbors = {}
  this._value = 0
  this._valueOverridden = false

  // Returns the ID of the block.
  this.getBlockId = function () {
    return _blockId
  }

  // Returns the block's hop count from the origin block.
  this.getHopCount = function () {
    return this._hopCount
  }

  // Returns the `BlockType` of the block.
  this.getBlockType = function () {
    return this._blockType
  }

  // Returns a dictionary with the neighboring
  // face numbers as keys, and blockIds as values.
  this.getNeighbors = function () {
    return this._neighbors
  }

  // Returns the 8-bit value of the block, either
  // from a value overridden by the client,
  // or the natural cubelet block value determined by
  // the construction.
  this.getValue = function () {
    return this._value
  }

  // Returns true if the value is overridden by
  // the client, or false otherwise.
  this.isValueOverridden = function () {
    return this._valueOverridden
  }

  return this
}

module.exports = Block

module.exports.typeForTypeId = function (typeId) {
  return __(BlockTypes).find(function (type) {
    return type.typeId === typeId
  }) || BlockTypes.UNKNOWN
}
