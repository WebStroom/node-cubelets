var util = require('util')
var Message = require('../message')

var GetNeighborBlocksRequest = function (hopCount) {
  Message.call(this)
  this.hopCount = (typeof hopCount === 'undefined') ? 1 : hopCount
}

util.inherits(GetNeighborBlocksRequest, Message)

GetNeighborBlocksRequest.prototype.encodeBody = function () {
  return (this.hopCount === 1) ?
    new Buffer(0) :
    new Buffer([ this.hopCount ])
}

module.exports = GetNeighborBlocksRequest
