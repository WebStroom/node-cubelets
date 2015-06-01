var util = require('util')
var Message = require('../message')

var FlashMemoryToBlockRequest = function (id, slotIndex) {
  Message.call(this)
  this.slotIndex = slotIndex
  this.id = id
}

util.inherits(FlashMemoryToBlockRequest, Message)

FlashMemoryToBlockRequest.prototype.encodeBody = function () {
  return Buffer.concat([
    new Buffer([ this.slotIndex ]),
    Message.Encoder.encodeID(this.id)
  ])
}

module.exports = FlashMemoryToBlockRequest
