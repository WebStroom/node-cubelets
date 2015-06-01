var util = require('util')
var Message = require('../message')

var GetBlockValueResponse = function (id, value, result) {
  Message.call(this)
  this.id = id
  this.value = value
  this.result = result
}

util.inherits(GetBlockValueResponse, Message)

GetBlockValueResponse.prototype.decode = function (data) {
  if (data.length !== 5) {
    this.error = new Error('Size should be 5 bytes but is', data.length, 'bytes.')
    return false
  }

  this.id = Message.Decoder.decodeID(data.slice(0, 3))
  this.value = data.readUInt8(3)
  this.result = data.readUInt8(4)
  return true
}

module.exports = GetBlockValueResponse
