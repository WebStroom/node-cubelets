var util = require('util')
var Message = require('../message')

var PingRequest = function (blockId, payload) {
  Message.call(this, blockId)
  this.payload = payload
}

util.inherits(PingRequest, Message)

PingRequest.prototype.encodeBody = function () {
  return this.payload
}

module.exports = PingRequest
