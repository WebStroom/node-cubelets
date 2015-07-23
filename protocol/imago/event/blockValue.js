var util = require('util')
var Message = require('../message')

var BlockValueEvent = function (blocks) {
  Message.call(this)
  this.blocks = blocks
}

util.inherits(BlockValueEvent, Message)

BlockValueEvent.prototype.decodeBody = function (body) {
  if (body.length % 4 !== 0) {
    this.error = new Error('Size should be divisible by 4.')
    return false
  }

  var blocks = []
  var count = body.length / 4
  for (var i = 0; i < count; ++i) {
    var p = i * 4
    /* format: [ id2, id1, id0, value ] */
    blocks.push({
      blockId: Message.Decoder.decodeId(body.slice(p + 0, p + 3)),
      value: body.readUInt8(p + 3)
    })
  }

  this.blocks = blocks
  return true
}

module.exports = BlockValueEvent
