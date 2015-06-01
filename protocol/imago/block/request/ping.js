var util = require('util')
var Message = require('../message')

var PingRequest = function (id, payload) {
  Message.call(this, id)
  this.payload = payload
}

util.inherits(PingRequest, Message)

PingRequest.prototype.encodeBody = function () {
  return this.payload
}

module.exports = PingRequest
