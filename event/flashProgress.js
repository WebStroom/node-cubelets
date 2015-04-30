var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')

var FlashProgressEvent = function (id, progress) {
  Message.call(this)
  this.progress = progress
  this.id = id
}

util.inherits(FlashProgressEvent, Message)

FlashProgressEvent.prototype.decode = function (data) {
  if (data.length < 5) {
    console.error('Size should be at least 5 bytes but is', data.length, 'bytes.')
    return false
  }

  this.progress = data.readUInt16LE(0)
  this.id = Decoder.decodeID(data.slice(2, 5))
  return true
}

module.exports = FlashProgressEvent
