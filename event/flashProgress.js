var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')

var FlashProgressEvent = function (progress) {
  Message.call(this)
  this.progress = progress
}

util.inherits(FlashProgressEvent, Response)

module.exports = FlashProgressEvent
