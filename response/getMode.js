var util = require('util')
var Message = require('../message')

var GetModeResponse = function (mode) {
  Message.call(this)
  this.mode = mode
}

util.inherits(GetModeResponse, Message)

GetModeResponse.prototype.decode = function (data) {
  if (data.length !== 1) {
    console.error('Size should be 1 byte but is', data.length, 'bytes.')
    return
  }

  this.mode = data.readUInt8(0)
}

module.exports = GetModeResponse
