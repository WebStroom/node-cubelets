var util = require('util')
var Message = require('../message')

var UnregisterBlockValueEventCommand = function(id) {
  Message.call(this)
  this.id = id
}

util.inherits(UnregisterBlockValueEventCommand, Message)

UnregisterBlockValueEventCommand.prototype.encodeBody = function() {
  var encodedID = Message.Encoder.encodeID(this.id)
  return new Buffer([
    encodedID.readUInt8(0),
    encodedID.readUInt8(1),
    encodedID.readUInt8(2)
  ])
}

module.exports = UnregisterBlockValueEventCommand
