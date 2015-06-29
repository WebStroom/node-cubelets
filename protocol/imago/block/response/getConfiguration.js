var util = require('util')
var Message = require('../message')

var GetConfigurationResponse = function (id) {
  Message.call(this, id)
}

util.inherits(GetConfigurationResponse, Message)

GetConfigurationResponse.prototype.decodeBody = function (body) {
  throw new Error('not implemented')
}

module.exports = GetConfigurationResponse
