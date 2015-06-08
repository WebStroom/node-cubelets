var util = require('util')
var Message = require('../message')

var UploadToMemoryResponse = function (result) {
  Message.call(this)
  this.result = result || 0
}

util.inherits(UploadToMemoryResponse, Message)

UploadToMemoryResponse.prototype.encodeBody = function () {
  return new Buffer([ this.result ])
}

UploadToMemoryResponse.prototype.decodeBody = function (body) {
  if (body.length !== 1) {
    this.error = new Error('Size should be 1 byte but is', body.length, 'bytes.')
    return false
  }

  this.result = body.readUInt8(0)
  return true
}

module.exports = UploadToMemoryResponse
