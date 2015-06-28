var util = require('util')
var Message = require('../message')

var GetBlockValueRequest = function (id) {
  Message.call(this)
  this.id = id
}

util.inherits(GetBlockValueRequest, Message)

GetBlockValueRequest.prototype.encodeBody = function () {
  return Message.Encoder.encodeID(this.id)
}

module.exports = GetBlockValueRequest
