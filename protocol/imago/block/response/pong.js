var util = require('util')
var Message = require('../message')

var PongResponse = function (blockId, payload) {
  Message.call(this, blockId)
  this.payload = payload
}

util.inherits(PongResponse, Message)

PongResponse.prototype.decode = function (body) {
  this.payload = body
  return true
}

module.exports = PongResponse
