var util = require('util')
var Message = require('../message')

var UnregisterBlockValueEventRequest = function (id) {
  Message.call(this)
  this.id = id
}

util.inherits(UnregisterBlockValueEventRequest, Message)

UnregisterBlockValueEventRequest.prototype.encodeBody = function () {
  return Message.Encoder.encodeID(this.id)
}

UnregisterBlockValueEventRequest.prototype.decodeBody = function (body) {
  if (body.length !== 3) {
    this.error = new Error('Size should be 3 bytes but is', body.length, 'bytes.')
    return false
  }

  this.id = Message.Decoder.decodeID(body)
  return true
}

module.exports = UnregisterBlockValueEventRequest
