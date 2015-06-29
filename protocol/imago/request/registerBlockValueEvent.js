var util = require('util')
var Message = require('../message')

var RegisterBlockValueEventRequest = function (id) {
  Message.call(this)
  this.id = id
}

util.inherits(RegisterBlockValueEventRequest, Message)

RegisterBlockValueEventRequest.prototype.encodeBody = function () {
  return Message.Encoder.encodeID(this.id)
}

RegisterBlockValueEventRequest.prototype.decodeBody = function (body) {
  if (body.length !== 3) {
    this.error = new Error('Size should be 3 bytes but is', body.length, 'bytes.')
    return false
  }

  this.id = Message.Decoder.decodeID(body)
  return true
}

module.exports = RegisterBlockValueEventRequest
