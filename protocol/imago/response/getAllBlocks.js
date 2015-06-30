var util = require('util')
var Message = require('../message')

var GetAllBlocks = function (blocks) {
  Message.call(this)
  this.blocks = blocks
}

util.inherits(GetAllBlocks, Message)

GetAllBlocks.prototype.decodeBody = function (body) {
  if (body.length % 5 !== 0) {
    this.error = new Error('Size should be divisible by 5.')
    return false
  }

  var blocks = []
  var count = body.length / 5
  for (var i = 0; i < count; ++i) {
    var p = i * 5
    /* format: [ id2, id1, id0, hc, face ] */
    blocks.push({
      id: Message.Decoder.decodeID(body.slice(p + 0, p + 3)),
      hopCount: body.readUInt8(p + 3),
      faceIndex: body.readUInt8(p + 4)
    })
  }

  this.blocks = blocks
  return true
}

module.exports = GetAllBlocks
