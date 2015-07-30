var util = require('util')
var Message = require('../message')
var __ = require('underscore')

var GetNeighborBlocksResponse = function (neighbors) {
  Message.call(this)
  this.neighbors = neighbors || {}
}

util.inherits(GetNeighborBlocksResponse, Message)

GetNeighborBlocksResponse.prototype.encodeBody = function () {
  var body = new Buffer([])
  __(this.neighbors).each(function (blockId, faceIndex) {
    body = Buffer.concat([ body,
      Message.Encoder.encodeId(blockId),
      new Buffer([ faceIndex ])
    ])
  })
  return body
}

GetNeighborBlocksResponse.prototype.decodeBody = function (body) {
  if (body.length % 4 !== 0) {
    this.error = new Error('Size should be divisible by 4.')
    return false
  }

  var neighbors = {}
  var count = body.length / 4
  for (var i = 0; i < count; ++i) {
    var p = i * 4
    var faceIndex = body.readUInt8(p + 3)
    neighbors[faceIndex] = Message.Decoder.decodeId(body.slice(p + 0, p + 3))
  }

  this.neighbors = neighbors
  return true
}

module.exports = GetNeighborBlocksResponse
