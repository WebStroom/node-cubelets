var util = require('util')
var Message = require('../message')
var Encoder = require('../../encoder')

var SetValueCommand = function (id, value) {
  Message.call(this, id)
  this.value = value
}

util.inherits(SetValueCommand, Message)

SetValueCommand.prototype.encodeBody = function () {
  return new Buffer([ this.value ])
}

module.exports = SetValueCommand
