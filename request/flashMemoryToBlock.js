var util = require('util')
var Message = require('../message')
var Encoder = require('../encoder')

var FlashMemoryToBlockRequest = function (id, slotIndex) {
  Message.call(this)
  this.slotIndex = slotIndex
  this.id = id
}

util.inherits(FlashMemoryToBlockRequest, Message)

FlashMemoryToBlockRequest.prototype.encodeBody = function () {
  return Buffer.concat([
    new Buffer([ this.slotIndex ]),
    Encoder.encodeID(this.id)
  ])
}

module.exports = FlashMemoryToBlockRequest
