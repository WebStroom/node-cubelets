var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')

var GetNeighborhoodResponse = function (neighbors) {
  Message.call(this, data, code)
  this.neighbors = []
}

util.inherits(GetNeighborhoodResponse, Message)

GetNeighborhoodResponse.prototype.decode = function (data) {
  if (data.length % 5 != 0) {
    console.error('Size should be divisible by 5.')
    return
  }

  var neighbors = []
  var count = data.length / 5
  for (var i = 0; i < count; ++i) {
    var p = i * 5
    /* format: [ id2, id1, id0, hc, face ] */
    neighbors.push({
      id: Decoder.decodeId(data.slice(p + 0, p + 3)),
      hopCount: data.readUInt8(p + 3),
      faceIndex: data.readUInt8(p + 4)
    })
  }

  this.neighbors = neighbors
}

module.exports = GetNeighborhoodResponse
