var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')

var BlockValueEvent = function (id, value) {
  Message.call(this)
  this.id = id
  this.value = value
}

util.inherits(BlockValueEvent, Message)

BlockValueEvent.prototype.decode = function (data) {
  if (data.length != 4) {
    console.error('Size should be 4 bytes but is', data.length, 'bytes.')
    return
  }

  this.id = Decoder.decodeID(data.slice(0, 3))
  this.value = data.readUInt8(3)
}

module.exports = BlockValueEvent
