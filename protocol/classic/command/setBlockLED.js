var util = require('util')
var Message = require('../message')

var SetBlockLEDCommand = function (id, enable) {
  Message.call(this)
  this.id = id
  this.enable = enable
}

util.inherits(SetBlockLEDCommand, Message)

SetBlockLEDCommand.prototype.encodeBody = function () {
  var encodedID = Message.Encoder.encodeID(this.id)
  return new Buffer([
    (this.enable ? 'v' : 'z').charCodeAt(0),
    encodedID.readUInt8(0),
    encodedID.readUInt8(1),
    encodedID.readUInt8(2)
  ])
}

module.exports = SetBlockLEDCommand
