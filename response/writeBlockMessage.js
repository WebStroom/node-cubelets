var util = require('util')
var Message = require('../message')

var WriteBlockMessageResponse = function (result) {
  Message.call(this)
  this.result = result
}

util.inherits(WriteBlockMessageResponse, Message)

WriteBlockMessageResponse.prototype.decode = function (data) {
  if (data.length !== 1) {
    console.error('Size should be 1 byte but is', data.length, 'bytes.')
    return
  }

  this.result = data.readUInt8(0)
}

module.exports = WriteBlockMessageResponse
