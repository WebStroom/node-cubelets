var util = require('util')
var Message = require('../message')

var UploadToMemoryRequest = function (slotIndex, slotSize, blockType, version, isCustom, crc) {
  Message.call(this)
  this.slotIndex = slotIndex
  this.slotSize = slotSize
  this.blockType = blockType
  this.version = version
  this.isCustom = isCustom
  this.crc = crc
}

util.inherits(UploadToMemoryRequest, Message)

UploadToMemoryRequest.prototype.encodeBody = function () {
  var body = new Buffer(9)
  body.writeUInt8(this.slotIndex, 0)
  body.writeUInt16BE(this.slotSize, 1)
  body.writeUInt8(this.blockType, 3)
  Message.Encoder.encodeVersion(this.version).copy(body, 4, 0)
  body.writeUInt8(this.isCustom ? 1 : 0, 7)
  body.writeUInt8(this.crc, 8)
  return body
}

module.exports = UploadToMemoryRequest
