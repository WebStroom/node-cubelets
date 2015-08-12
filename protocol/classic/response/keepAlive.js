var util = require('util')
var Message = require('../message')

var KeepAliveResponse = function () {
  Message.call(this)
}

util.inherits(KeepAliveResponse, Message)

module.exports = KeepAliveResponse
