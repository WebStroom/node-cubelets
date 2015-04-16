var util = require('util')
var Message = require('../message')
var Encoder = require('../encoder')

var VisitNeighborRequest = function (id) {
  Message.call(this)
  this.id = id
}

util.inherits(VisitNeighborRequest, Message)

VisitNeighborRequest.prototype.encodeBody = function () {
  var encodedID = Encoder.encodeID(this.id)
  return new Buffer([
    encodedID.readUInt8(0),
    encodedID.readUInt8(1),
    encodedID.readUInt8(2)
  ])
}

module.exports = VisitNeighborRequest
