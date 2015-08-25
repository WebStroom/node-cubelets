var util = require('util')
var Message = require('../message')

var GetAllBlocks = function (blocks) {
  Message.call(this)
  this.blocks = blocks || []
}

util.inherits(GetAllBlocks, Message)

GetAllBlocks.prototype.encodeBody = function () {
  var body = new Buffer([])
  this.blocks.forEach(function (block) {
    body = Buffer.concat([ body,
      Message.Encoder.encodeId(block.blockId),
      new Buffer([
        block.hopCount,
        block.faceIndex
      ])
    ])
  })
  return body
}

GetAllBlocks.prototype.decodeBody = function (body) {
  this.blocks = []

  if (body.length === 0) {
    return true
  }

  if (body.length % 5 !== 0) {
    this.error = new Error('Size should be divisible by 5 but is', body.length, 'bytes.')
    return false
  }

  var blocks = []
  var count = body.length / 5
  for (var i = 0; i < count; ++i) {
    var p = i * 5
    /* format: [ id2, id1, id0, hc, face ] */
    blocks.push({
      blockId: Message.Decoder.decodeId(body.slice(p + 0, p + 3)),
      hopCount: body.readUInt8(p + 3),
      faceIndex: body.readUInt8(p + 4)
    })
  }

  this.blocks = blocks
  return true
}

module.exports = GetAllBlocks
