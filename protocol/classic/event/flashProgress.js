var util = require('util')
var Message = require('../message')

var FlashProgressEvent = function () {
  Message.call(this)
}

util.inherits(FlashProgressEvent, Message)

FlashProgressEvent.prototype.decode = function (data) {
  this.error = new Error('not implemented')
  return false
}

module.exports = FlashProgressEvent
