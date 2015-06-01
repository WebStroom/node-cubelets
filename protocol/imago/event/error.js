var util = require('util')
var Message = require('../message')

var ErrorEvent = function (errorCode, messageCode) {
  Message.call(this)
  this.errorCode = errorCode
  this.messageCode = messageCode
}

util.inherits(ErrorEvent, Message)

ErrorEvent.prototype.decode = function (data) {
  if (data.length > 0) {
    this.errorCode = data.readUInt8(0)
  }

  if (data.length > 1) {
    this.messageCode = data.readUInt8(1)
  }

  return true
}

module.exports = ErrorEvent
