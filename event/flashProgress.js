var util = require('util')
var Message = require('../message')

var FlashProgressEvent = function () {
  Message.call(this)
}

util.inherits(FlashProgressEvent, Message)

module.exports = FlashProgressEvent
