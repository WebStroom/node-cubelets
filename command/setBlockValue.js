var util = require('util')
var Message = require('../message')
var Encoder = require('../encoder')

var SetBlockValueCommand = function (id, value) {
  Message.call(this)
  this.id = id
  this.value = value
}

util.inherits(SetBlockValueCommand, Message)

SetBlockValueCommand.prototype.encodeBody = function () {
  var encodedID = Encoder.encodeID(this.id)
  return new Buffer([
    encodedID.readUInt8(0),
    encodedID.readUInt8(1),
    encodedID.readUInt8(2),
    this.value
  ])
}

module.exports = SetBlockValueCommand
