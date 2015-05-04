var util = require('util')
var Message = require('../message')

var UploadToMemoryCompleteEvent = function (result) {
  Message.call(this)
  this.result = result
}

util.inherits(UploadToMemoryCompleteEvent, Message)

UploadToMemoryCompleteEvent.prototype.decode = function (data) {
  if (data.length !== 1) {
    console.error('Size should be 1 byte but is', data.length, 'bytes.')
    return false
  }

  this.result = data.readUInt8(0)
  return true
}

module.exports = UploadToMemoryCompleteEvent
