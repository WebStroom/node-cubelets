var util = require('util')
var Message = require('../message')

var RegisterBlockValueEventRequest = function (enabled) {
  Message.call(this)
  this.enabled = enabled
}

util.inherits(RegisterBlockValueEventRequest, Message)

RegisterBlockValueEventRequest.prototype.encodeBody = function () {
  return new Buffer([
    this.enabled ? 1 : 0
  ])
}

module.exports = RegisterBlockValueEventRequest
