var util = require('util')
var Message = require('../message')
var ClearBlockValueCommand = require('./clearBlockValue')

var SetBlockValueCommand = function (id, value) {
  Message.call(this)
  this.id = id
  this.value = value
}

util.inherits(SetBlockValueCommand, Message)

SetBlockValueCommand.prototype.encodeBody = function () {
  return Buffer.concat([
    Message.Encoder.encodeID(this.id),
    new Buffer([ this.value ])
  ])
}

SetBlockValueCommand.prototype.decodeBody = function (body) {
  if (body.length !== 4) {
    this.error = new Error('Size should be 4 bytes but is', body.length, 'bytes.')
    return false
  }

  this.id = Message.Decoder.decodeID(body.slice(0, 3))
  this.value = body.readUInt8(3)
  return true
}

SetBlockValueCommand.prototype.prioritize = function (otherCommand) {
  if (otherCommand instanceof SetBlockValueCommand ||
      otherCommand instanceof ClearBlockValueCommand) {
    return otherCommand.id === this.id ? 1 : 0
  } else {
    return 0
  }
}

module.exports = SetBlockValueCommand
