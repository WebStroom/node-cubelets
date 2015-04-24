var util = require('util')
var Message = require('../message')

var DebugEvent = function (data) {
  Message.call(this)
  this.data = data
}

util.inherits(DebugEvent, Message)

DebugEvent.prototype.decode = function (data) {
  console.log('DEBUG',
    ((this.data = data))
  )
}

module.exports = DebugEvent
