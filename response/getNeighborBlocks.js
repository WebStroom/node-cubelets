var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')

var GetNeighborBlocksResponse = function (blocks) {
  Message.call(this)
  this.blocks = blocks
}

util.inherits(GetNeighborBlocksResponse, Message)

GetNeighborBlocksResponse.prototype.decode = function (data) {
  if (data.length % 4 != 0) {
    console.error('Size should be divisible by 4.')
    return false
  }

  var blocks = []
  var count = data.length / 4
  for (var i = 0; i < count; ++i) {
    var p = i * 4
    /* format: [ id2, id1, id0, face ] */
    blocks.push({
      id: Decoder.decodeID(data.slice(p + 0, p + 3)),
      faceIndex: data.readUInt8(p + 3)
    })
  }

  this.blocks = blocks
  return true
}

module.exports = GetNeighborBlocksResponse
