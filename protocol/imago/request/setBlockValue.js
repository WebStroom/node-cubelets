var util = require('util')
var SetBlockValueCommand = require('../command/setBlockValue')

var SetBlockValueRequest = function (id, value) {
  SetBlockValueCommand.call(this, id, value)
}

util.inherits(SetBlockValueRequest, SetBlockValueCommand)

module.exports = SetBlockValueRequest
