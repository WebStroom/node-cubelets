var util = require('util')
var Message = require('../message')

var SetBlockValueResponse = function (result) {
  Message.call(this)
  this.result = result
}

util.inherits(SetBlockValueResponse, Message)

SetBlockValueResponse.prototype.decode = function (data) {
  if (data.length !== 1) {
    this.error = new Error('Size should be 1 byte but is', data.length, 'bytes.')
    return false
  }

  this.result = data.readUInt8(0)
  return true
}

module.exports = SetBlockValueResponse
