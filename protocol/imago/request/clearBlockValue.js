var util = require('util')
var ClearBlockValueCommand = require('../command/clearBlockValue')

var ClearBlockValueRequest = function (id) {
  ClearBlockValueCommand.call(this, id)
}

util.inherits(ClearBlockValueRequest, ClearBlockValueCommand)

module.exports = ClearBlockValueRequest
