var util = require('util')
var Message = require('../message')

var GetNeighborBlocksEvent = function (blocks) {
  Message.call(this)
  this.blocks = blocks
}

util.inherits(GetNeighborBlocksEvent, Message)

GetNeighborBlocksEvent.prototype.decode = function (data) {
  this.blocks = []

  if (data.length === 0) {
    return true
  }

  if (data.length % 3 !== 0) {
    this.error = new Error('Size should be divisible by 3 but is', data.length, 'bytes.')
    return false
  }

  var p = 0
  var count = data.length / 3
  for (var i = 0; i < count; ++i) {
    blocks.push({
      id: Message.Decoder.decodeID(data.slice(p + 0, p + 3)),
      hopCount: 0
    })
    p += 3
  }

  return true
}

module.exports = GetNeighborBlocksEvent
