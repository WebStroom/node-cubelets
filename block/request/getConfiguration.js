var util = require('util')
var Message = require('../message')
var Encoder = require('../../encoder')

var GetConfigurationRequest = function (id) {
  Message.call(this, id)
}

util.inherits(GetConfigurationRequest, Message)

module.exports = GetConfigurationRequest
