var util = require('util')
var Message = require('../message')
var Decoder = require('../../decoder')
var Version = require('../../version')

var GetConfigurationResponse = function (id) {
  Message.call(this, id)
}

util.inherits(GetConfigurationResponse, Message)

GetConfigurationResponse.prototype.decode = function (data) {
  console.error('Not implemented.')
  return false
}

module.exports = GetConfigurationResponse
