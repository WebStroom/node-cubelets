var Types = require('./config.json')['blockTypes']
var __ = require('underscore')

var Cubelet = function (blockId, hopCount, blockType) {
  this.blockId = blockId
  this.hopCount = hopCount
  this.blockType = blockType || Types.UNKNOWN
}

module.exports = Cubelet
module.exports.BlockTypes = Types

module.exports.typeForTypeId = function (typeId) {
  return __(Types).find(function (type) {
    return type.typeId === typeId
  }) || Types.UNKNOWN
}
