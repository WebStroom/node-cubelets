var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')
var Version = require('../version')

var GetConfigurationResponse = function (id) {
  Message.call(this)
  this.id = id
}

util.inherits(GetConfigurationResponse, Message)

GetConfigurationResponse.prototype.decode = function (data) {
  if (data.length !== 14) {
    console.error('Size should be 14 bytes but is', data.length, 'bytes.')
    return false
  }

  this.hardwareVersion = Decoder.decodeVersion(data.slice(0, 3))
  this.bootloaderVersion = Decoder.decodeVersion(data.slice(3, 6))
  this.applicationVersion = Decoder.decodeVersion(data.slice(6, 9))
  this.id = Decoder.decodeID(data.slice(9, 12))
  this.mode = data.readUInt8(12)
  this.hasCustomApplication = data.readUInt8(13) ? true : false
  return true
}

module.exports = GetConfigurationResponse
