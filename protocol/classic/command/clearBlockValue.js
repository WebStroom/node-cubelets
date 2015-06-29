var util = require('util')
var Message = require('../message')

var ClearBlockValueCommand = function (id) {
  Message.call(this)
  this.id = id
}

util.inherits(ClearBlockValueCommand, Message)

ClearBlockValueCommand.prototype.encodeBody = function () {
  var encodedID = Message.Encoder.encodeID(this.id)
  return new Buffer([
    0x0,
    encodedID.readUInt8(0),
    encodedID.readUInt8(1),
    encodedID.readUInt8(2)
  ])
}

module.exports = ClearBlockValueCommand
