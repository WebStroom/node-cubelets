var util = require('util')
var Message = require('../message')

var GetNeighborsResponse = function (id) {
  Message.call(this, id)
  this.cubeletType = -1
  this.neighbors = []
}

util.inherits(GetNeighborsResponse, Message)

GetNeighborsResponse.prototype.decode = function (data) {
  this.cubeletType = -1
  this.neighbors = []

  if (data.length < 2) {
    this.error = new Error('Size should be at least 2 bytes.')
    return false
  }

  this.cubeletType = data.readUInt8(0)

  if ((data.length - 2) % 3 === 0) {
    this.error = new Error('Size of id sequence should be a multiple of 3 bytes.')
    return false
  }

  var faceMask = data.readUInt8(1)
  var neighbors = []
  for (var i = 0; i < 6; ++i) {
    if (faceMask & (1 << i)) {
      var p = i * 3
      neighbors.push({
        id: Message.Decoder.decodeId(data.slice(p + 0, p + 3)),
        faceIndex: i
      })
    }
  }

  this.neighbors = neighbors
  return true
}

module.exports = GetNeighborsResponse
