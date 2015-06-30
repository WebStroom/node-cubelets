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

ClearBlockValueCommand.prototype.decodeBody = function (body) {
  if (body.length !== 3) {
    this.error = new Error('Size should be 3 bytes but is', body.length, 'bytes.')
    return false
  }

  this.id = Message.Decoder.decodeID(body)
  return true
}

ClearBlockValueCommand.prototype.prioritize = function (otherCommand) {
  if (otherCommand instanceof ClearBlockValueCommand) {
    return otherCommand.id === this.id ? 1 : 0
  } else {
    return 0
  }
}

module.exports = ClearBlockValueCommand
