var util = require('util')
var Message = require('../message')

var BlockValueEvent = function (id, value) {
  Message.call(this)
  this.id = id
  this.value = value
}

util.inherits(BlockValueEvent, Message)

BlockValueEvent.prototype.decodeBody = function (data) {
  if (data.length != 4) {
    this.error = new Error('Size should be 4 bytes but is', data.length, 'bytes.')
    return false
  }

  this.id = Message.Decoder.decodeID(data.slice(0, 3))
  this.value = data.readUInt8(3)
  return true
}

module.exports = BlockValueEvent
