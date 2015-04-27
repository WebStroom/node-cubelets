var util = require('util')
var Message = require('../message')
var Decoder = require('../../decoder')

var PongResponse = function (id, payload) {
  Message.call(this, id)
  this.payload = payload
}

util.inherits(PongResponse, Message)

PongResponse.prototype.decode = function (data) {
  this.payload = data
  return true
}

module.exports = PongResponse
