var util = require('util')
var Message = require('../message')

var ResetCommand = function (blockId) {
  Message.call(this)
  this.blockId = blockId
}

util.inherits(ResetCommand, Message)

ResetCommand.prototype.encodeBody = function () {
  var encodedId = Message.Encoder.encodeId(this.blockId)
  return new Buffer([
    encodedId.readUInt8(0),
    encodedId.readUInt8(1),
    encodedId.readUInt8(2)
  ])
}

module.exports = ResetCommand
