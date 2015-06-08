var util = require('util')
var Message = require('../message')

var FlashMemoryToBlockResponse = function (result) {
  Message.call(this)
  this.result = result || 0
}

util.inherits(FlashMemoryToBlockResponse, Message)

FlashMemoryToBlockResponse.prototype.encodeBody = function () {
  return new Buffer([ this.result ])
}

FlashMemoryToBlockResponse.prototype.decodeBody = function (data) {
  if (data.length !== 1) {
    this.error = new Error('Size should be 1 byte but is', data.length, 'bytes.')
    return false
  }

  this.result = data.readUInt8(0)
  return true
}

module.exports = FlashMemoryToBlockResponse
