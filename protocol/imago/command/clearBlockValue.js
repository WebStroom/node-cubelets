var util = require('util')
var Message = require('../message')

var ClearBlockValueCommand = function (id) {
  Message.call(this)
  this.id = id
}

util.inherits(ClearBlockValueCommand, Message)

ClearBlockValueCommand.prototype.encodeBody = function () {
  return Message.Encoder.encodeID(this.id)
}

module.exports = ClearBlockValueCommand
