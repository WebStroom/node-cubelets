var BlockTypes = require('./config.json')['blockTypes']
var __ = require('underscore')

var Cubelet = function (blockId, hopCount, blockType) {
  this.blockId = blockId
  this.hopCount = hopCount
  this.blockType = blockType || BlockTypes.UNKNOWN
}

module.exports = Cubelet
module.exports.BlockTypes = BlockTypes

module.exports.typeForTypeId = function (typeId) {
  return __(BlockTypes).find(function (type) {
    return type.typeId === typeId
  }) || BlockTypes.UNKNOWN
}
