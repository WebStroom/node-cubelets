var util = require('util')
var Message = require('../message')

var FlashProgressEvent = function (id, progress) {
  Message.call(this)
  this.progress = progress
  this.id = id
}

util.inherits(FlashProgressEvent, Message)

FlashProgressEvent.prototype.encodeBody = function () {
  var body = new Buffer(5)
  body.writeUInt16LE(this.progress, 0)
  Message.Encoder.encodeID(this.id).copy(body, 2, 0)
  return body
}

FlashProgressEvent.prototype.decodeBody = function (body) {
  if (body.length < 5) {
    this.error = new Error('Size should be at least 5 bytes but is', body.length, 'bytes.')
    return false
  }

  this.progress = body.readUInt16LE(0)
  this.id = Message.Decoder.decodeID(body.slice(2, 5))
  return true
}

module.exports = FlashProgressEvent
