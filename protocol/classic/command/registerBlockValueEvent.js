var util = require('util')
var Message = require('../message')

var RegisterBlockValueEventCommand = function (id) {
  Message.call(this)
  this.id = id
}

util.inherits(RegisterBlockValueEventCommand, Message)

RegisterBlockValueEventCommand.prototype.encodeBody = function () {
  return Message.Encoder.encodeID(this.id)
}

module.exports = RegisterBlockValueEventCommand
