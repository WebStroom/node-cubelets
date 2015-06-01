var util = require('util')
var Message = require('../message')

var ResetCommand = function(id) {
  Message.call(this)
}

util.inherits(ResetCommand, Message)

ResetCommand.prototype.encodeBody = function() {
  var encodedID = Message.Encoder.encodeID(this.id)
  return new Buffer([
    encodedID.readUInt8(0),
    encodedID.readUInt8(1),
    encodedID.readUInt8(2)
  ])
}

module.exports = ResetCommand
