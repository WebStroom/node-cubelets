var util = require('util')
var Message = require('../message')

var SetModeResponse = function (mode) {
  Message.call(this)
  this.mode = mode
}

util.inherits(SetModeResponse, Message)

SetModeResponse.prototype.decode = function (data) {
  if (data.length !== 1) {
    this.error = new Error('Size should be 1 byte but is', data.length, 'bytes.')
    return false
  }

  this.mode = data.readUInt8(0)
  return true
}

module.exports = SetModeResponse
