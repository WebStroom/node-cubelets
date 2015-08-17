var util = require('util')
var Message = require('../message')

var FlashCompleteEvent = function () {
  Message.call(this)
}

util.inherits(FlashCompleteEvent, Message)

FlashCompleteEvent.prototype.decodeBody = function (body) {
  this.error = new Error('not implemented')
  return false
}

module.exports = FlashCompleteEvent
