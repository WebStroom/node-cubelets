var util = require('util')
var Message = require('../message')

var GetConfigurationResponse = function (blockId) {
  Message.call(this, blockId)
}

util.inherits(GetConfigurationResponse, Message)

GetConfigurationResponse.prototype.decodeBody = function (body) {
  throw new Error('not implemented')
}

module.exports = GetConfigurationResponse
