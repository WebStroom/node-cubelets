var util = require('util')
var Message = require('../message')

var UnregisterBlockValueEventCommand = function (id) {
  Message.call(this)
  this.id = id
}

util.inherits(UnregisterBlockValueEventCommand, Message)

UnregisterBlockValueEventCommand.prototype.encodeBody = function () {
  return Message.Encoder.encodeID(this.id)
}

module.exports = UnregisterBlockValueEventCommand
