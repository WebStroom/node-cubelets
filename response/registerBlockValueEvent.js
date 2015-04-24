var util = require('util')
var Message = require('../message')

var RegisterBlockValueEventResponse = function (result) {
  Message.call(this)
  this.result = result
}

util.inherits(RegisterBlockValueEventResponse, Message)

RegisterBlockValueEventResponse.prototype.decode = function (data) {
  if (data.length !== 1) {
    console.error('Size should be 1 byte but is', data.length, 'bytes.')
    return
  }

  this.result = data.readUInt8(0)
}

module.exports = RegisterBlockValueEventResponse
