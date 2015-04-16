var util = require('util')
var Message = require('../message')

var GetNeighborhoodRequest = function () {
  Message.call(this)
}

util.inherits(GetNeighborhoodRequest, Message)

module.exports = GetNeighborhoodRequest
