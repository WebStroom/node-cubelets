var util = require('util')
var Message = require('../message')

var GetNeighborBlocksEvent = function (neighbors) {
  Message.call(this)
  this.neighbors = neighbors || []
}

util.inherits(GetNeighborBlocksEvent, Message)

GetNeighborBlocksEvent.prototype.decodeBody = function (body) {
  this.neighbors = []

  if (body.length === 0) {
    return true
  }

  if (body.length % 3 !== 0) {
    this.error = new Error('Size should be divisible by 3 but is', body.length, 'bytes.')
    return false
  }

  var p = 0
  var count = body.length / 3
  var neighbors = []
  for (var i = 0; i < count; ++i) {
    var blockId = Message.Decoder.decodeId(body.slice(p + 0, p + 3))
    if (0 !== blockId) {
      neighbors.push(blockId)
    }
    p += 3
  }

  this.neighbors = neighbors
  return true
}

module.exports = GetNeighborBlocksEvent
