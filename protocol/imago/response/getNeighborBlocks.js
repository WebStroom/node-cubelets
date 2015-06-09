var util = require('util')
var Message = require('../message')

var GetNeighborBlocksResponse = function (blocks) {
  Message.call(this)
  this.blocks = blocks || []
}

util.inherits(GetNeighborBlocksResponse, Message)

GetNeighborBlocksResponse.prototype.encodeBody = function () {
  var body = new Buffer([])
  this.blocks.forEach(function (block) {
    body = Buffer.concat([ body,
      Message.Encoder.encodeID(block.id),
      new Buffer([ block.faceIndex ])
    ])
  })
  return body
}

GetNeighborBlocksResponse.prototype.decodeBody = function (body) {
  if (body.length % 4 != 0) {
    this.error = new Error('Size should be divisible by 4.')
    return false
  }

  var blocks = []
  var count = body.length / 4
  for (var i = 0; i < count; ++i) {
    var p = i * 4
    /* format: [ id2, id1, id0, face ] */
    blocks.push({
      id: Message.Decoder.decodeID(body.slice(p + 0, p + 3)),
      faceIndex: body.readUInt8(p + 3),
      hopCount: 1 // hop count is implied for neighbor blocks
    })
  }

  this.blocks = blocks
  return true
}

module.exports = GetNeighborBlocksResponse
