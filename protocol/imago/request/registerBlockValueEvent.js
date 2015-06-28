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

module.exports = RegisterBlockValueEventRequest
