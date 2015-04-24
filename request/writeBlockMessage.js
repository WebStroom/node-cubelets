var util = require('util')
var Message = require('../message')
var Encoder = require('../encoder')

var WriteMessageRequest = function (type, id, size, data) {
  Message.call(this)
  this.type = type
  this.id = id
  this.size = size || 0
  this.data = data || new Buffer(0)
}

util.inherits(WriteMessageRequest, Message)

WriteMessageRequest.prototype.encodeBody = function () {
  return Buffer.concat([
    new Buffer([ this.typeID ]),
    Encoder.encodeID(this.id),
    new Buffer([ this.size ]),
    this.data
  ])
}

module.exports = WriteMessageRequest
