var util = require('util')
var Message = require('../message')

var EchoResponse = function (echo) {
  Message.call(this)
  this.echo = echo
}

util.inherits(EchoResponse, Message)

EchoResponse.prototype.decode = function (data) {
  this.echo = data
}

module.exports = EchoResponse
