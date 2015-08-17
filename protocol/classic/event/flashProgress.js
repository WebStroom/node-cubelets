var util = require('util')
var Message = require('../message')

var FlashProgressEvent = function () {
  Message.call(this)
}

util.inherits(FlashProgressEvent, Message)

FlashProgressEvent.prototype.decodeBody = function (body) {
  this.error = new Error('not implemented')
  return false
}

module.exports = FlashProgressEvent
