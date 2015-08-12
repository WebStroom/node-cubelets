var util = require('util')
var Message = require('../message')

var GetNeighborBlocksEvent = function (neighbors) {
  Message.call(this)
  this.neighbors = neighbors
}

util.inherits(GetNeighborBlocksEvent, Message)

GetNeighborBlocksEvent.prototype.decode = function (data) {
  this.neighbors = []

  if (data.length === 0) {
    return true
  }

  if (data.length % 3 !== 0) {
    this.error = new Error('Size should be divisible by 3 but is', data.length, 'bytes.')
    return false
  }

  var p = 0
  var count = data.length / 3
  var neighbors = []
  for (var i = 0; i < count; ++i) {
    var blockId = Message.Decoder.decodeId(data.slice(p + 0, p + 3))
    if (0 !== blockId) {
      neighbors.push(blockId)
    }
    p += 3
  }

  this.neighbors = neighbors
  return true
}

module.exports = GetNeighborBlocksEvent
