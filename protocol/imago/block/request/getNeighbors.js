var util = require('util')
var Message = require('../message')

var GetNeighborsRequest = function (id) {
  Message.call(this, id)
}

util.inherits(GetNeighborsRequest, Message)

module.exports = GetNeighborsRequest
