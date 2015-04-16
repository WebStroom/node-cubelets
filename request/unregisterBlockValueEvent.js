var util = require('util')
var Message = require('../message')

var UnregisterBlockValueEventRequest = function () {
  Message.call(this)
}

util.inherits(UnregisterBlockValueEventRequest, Message)

module.exports = UnregisterBlockValueEventRequest
