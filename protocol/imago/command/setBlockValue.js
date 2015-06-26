var util = require('util')
var Message = require('../message')

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

module.exports = SetBlockValueCommand
