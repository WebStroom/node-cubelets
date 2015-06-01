var util = require('util')
var SetBlockValueCommand = require('../command/setBlockValue')

var SetBlockValueRequest = function (id, value, clear) {
  SetBlockValueCommand.call(this, id, value, clear)
}

util.inherits(SetBlockValueRequest, SetBlockValueCommand)

module.exports = SetBlockValueRequest
