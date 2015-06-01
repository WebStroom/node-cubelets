var util = require('util')
var Message = require('../message')

var FlashCompleteEvent = function () {
  Message.call(this)
}

util.inherits(FlashCompleteEvent, Message)

FlashCompleteEvent.prototype.decode = function (data) {
  this.error = new Error('not implemented')
  return false
}

module.exports = FlashCompleteEvent
