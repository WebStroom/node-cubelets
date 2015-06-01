var util = require('util')
var Message = require('../message')

var GetConfigurationResponse = function (id) {
  Message.call(this, id)
}

util.inherits(GetConfigurationResponse, Message)

GetConfigurationResponse.prototype.decode = function (data) {
  throw new Error('not implemented')
}

module.exports = GetConfigurationResponse
