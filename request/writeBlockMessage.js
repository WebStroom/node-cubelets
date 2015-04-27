var util = require('util')
var Message = require('../message')

var WriteBlockMessageRequest = function (blockMessage) {
  Message.call(this)
  this.blockMessage = blockMessage
}

util.inherits(WriteBlockMessageRequest, Message)

WriteBlockMessageRequest.prototype.encodeBody = function () {
  return this.blockMessage.encode()
}

module.exports = WriteBlockMessageRequest
