var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')
var Version = require('../version')

var VisitNeighborResponse = function (id) {
  Message.call(this)
  this.id = id

  this.cubeletType = -1
  this.neighbors = []
  this.neighborCount = 0
}

util.inherits(VisitNeighborResponse, Message)

VisitNeighborResponse.prototype.neighborMap = function () {
  var map = {}
  this.neighbors.forEach(function (n, i) {
    map[n.faceIndex] = n.id
  })
  return map
}

VisitNeighborResponse.prototype.decode = function (data) {
  if (data.length < 2) {
    console.error('Size should be at least 2 bytes.')
    return
  }

  this.cubeletType = data.readUInt8(0)
  var faceMask = data.readUInt8(1)

  if ((data.length - 2) % 3 === 0) {
    console.error('Size should be a multiple of 3 bytes.')
    return
  }

  var neighbors = []
  var neighborCount = (data.length - 2) / 3
  for (var i = 0; i < 6; ++i) {
    if (faceMask & (1 << i)) {
      var p = i * 3
      neighbors.push({
        id: Decoder.decodeId(data.slice(p + 0, p + 3)),
        faceIndex: i
      })
      neighborCount++
    }
  }

  this.neighbors = neighbors
  this.neighborCount = neighborCount
}



module.exports = VisitNeighborResponse
