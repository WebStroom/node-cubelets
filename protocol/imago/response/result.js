var util = require('util')
var Message = require('../message')

var ResultResponse = function (result) {
  Message.call(this)
  this.result = result || 0
}

util.inherits(ResultResponse, Message)

ResultResponse.prototype.encodeBody = function () {
  return new Buffer([ this.result ])
}

ResultResponse.prototype.decodeBody = function (data) {
  if (data.length !== 1) {
    this.error = new Error('Size should be 1 byte but is', data.length, 'bytes.')
    return false
  }

  this.result = data.readUInt8(0)
  return true
}

module.exports = ResultResponse
