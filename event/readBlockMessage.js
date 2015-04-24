var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')

var ReadBlockMessageEvent = function (type, id, size, data) {
  Message.call(this)
  this.type = type
  this.id = id
  this.size = size
  this.data = data
}

util.inherits(ReadBlockMessageEvent, Message)

ReadBlockMessageEvent.prototype.decode = function (data) {
  if (data.length < 5) {
    console.error('Size should be at least 5 bytes but is', data.length, 'bytes.')
    return
  }

  this.type = data.readUInt8(0)
  this.id = Decoder.decodeID(data.slice(1, 4))
  this.size = data.readUInt8(4)

  var size = this.size
  var byteCount = data.length - 5 
  if (size !== byteCount) {
    console.error('Block message size should be', size, 'bytes but is', byteCount, 'bytes.')
    return
  }

  this.data = data.slice(5, 5 + size)
}

module.exports = ReadBlockMessageEvent
