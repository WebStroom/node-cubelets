var util = require('util')
var Message = require('../message')

var GetConfigurationResponse = function (blockId) {
  Message.call(this, blockId)
}

util.inherits(GetConfigurationResponse, Message)

GetConfigurationResponse.prototype.encodeBody = function () {
  return Buffer.concat([
    Message.Encoder.encodeVersion(this.hardwareVersion),
    Message.Encoder.encodeVersion(this.bootloaderVersion),
    Message.Encoder.encodeVersion(this.applicationVersion),
    Message.Encoder.encodeId(this.blockId),
    new Buffer([
      this.blockTypeId,
      this.mode,
      this.customApplication
    ])
  ])
}

GetConfigurationResponse.prototype.decodeBody = function (body) {
  if (body.length !== 15) {
    this.error = new Error('Size should be 15 bytes but is', body.length, 'bytes.')
    return false
  }

  this.hardwareVersion = Message.Decoder.decodeVersion(body.slice(0, 3))
  this.bootloaderVersion = Message.Decoder.decodeVersion(body.slice(3, 6))
  this.applicationVersion = Message.Decoder.decodeVersion(body.slice(6, 9))
  this.blockId = Message.Decoder.decodeId(body.slice(9, 12))
  this.blockTypeId = body.readUInt8(12)
  this.mode = body.readUInt8(13)
  this.customApplication = body.readUInt8(14)
  this.hasCustomApplication = (this.customApplication !== 0)
  return true
}

module.exports = GetConfigurationResponse
