var util = require('util')
var Message = require('../message')

var UnregisterBlockValueEventResponse = function (result) {
  Message.call(this)
  this.result = result
};

util.inherits(UnregisterBlockValueEventResponse, Message)

UnregisterBlockValueEventResponse.prototype.decode = function (data) {
  if (data.length !== 1) {
    console.error('Size should be 1 byte but is', data.length, 'bytes.')
    return
  }

  this.result = data.readUInt8(0)
}

module.exports = UnregisterBlockValueEventResponse
