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

module.exports = UnregisterBlockValueEventRequest
