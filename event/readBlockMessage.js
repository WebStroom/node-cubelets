var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')
var BlockProtocol = require('../protocol/block')

var ReadBlockMessageEvent = function (blockMessage) {
  Message.call(this)
  this.blockMessage = blockMessage
}

util.inherits(ReadBlockMessageEvent, Message)

ReadBlockMessageEvent.prototype.decode = function (data) {
  if (data.length < 5) {
    console.error('Size should be at least 5 bytes but is', data.length, 'bytes.')
    return false
  }

  var code = data.readUInt8(0)
  var type = BlockProtocol.typeForCode(code)
  if (!type) {
    console.error('Invalid block message type.')
    return false
  }

  var id = Decoder.decodeID(data.slice(1, 4))
  this.blockMessage = new type(id)

  var size = data.readUInt8(4)
  var byteCount = data.length - 5 
  if (size !== byteCount) {
    console.error('Block message size should be', size, 'bytes but is', byteCount, 'bytes.')
    return false
  }

  var body = data.slice(5, 5 + size)
  return this.blockMessage.decode(body)
}

module.exports = ReadBlockMessageEvent
