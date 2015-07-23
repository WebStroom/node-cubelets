var util = require('util')
var Message = require('../message')

var GetNeighborsResponse = function (blockId) {
  Message.call(this, blockId)
  this.neighbors = []
}

util.inherits(GetNeighborsResponse, Message)

GetNeighborsResponse.prototype.decodeBody = function (body) {
  this.neighbors = []

  if (body.length < 1) {
    this.error = new Error('Size should be at least 1 byte.')
    return false
  }

  var faceMask = body.readUInt8(0)

  if ((body.length - 1) % 3 === 0) {
    this.error = new Error('Size of blockId sequence should be a multiple of 3 bytes.')
    return false
  }

  var neighbors = []
  for (var i = 0; i < 6; ++i) {
    if (faceMask & (1 << i)) {
      var p = i * 3
      neighbors.push({
        blockId: Message.Decoder.decodeId(body.slice(p + 0, p + 3)),
        faceIndex: i
      })
    }
  }

  this.neighbors = neighbors
  return true
}

module.exports = GetNeighborsResponse
