var util = require('util')
var Message = require('../message')

var RegisterBlockValueEventRequest = function () {
  Message.call(this)
}

util.inherits(RegisterBlockValueEventRequest, Message)

module.exports = RegisterBlockValueEventRequest
