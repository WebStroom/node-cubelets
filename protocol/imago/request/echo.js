var util = require('util')
var Message = require('../message')

var EchoRequest = function (echo) {
  Message.call(this)
  this.echo = echo
}

util.inherits(EchoRequest, Message)

EchoRequest.prototype.encodeBody = function () {
  return this.echo
}

module.exports = EchoRequest
