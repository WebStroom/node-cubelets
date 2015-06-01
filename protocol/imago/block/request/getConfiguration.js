var util = require('util')
var Message = require('../message')

var GetConfigurationRequest = function (id) {
  Message.call(this, id)
}

util.inherits(GetConfigurationRequest, Message)

module.exports = GetConfigurationRequest
