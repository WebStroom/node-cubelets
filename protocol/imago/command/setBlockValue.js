var util = require('util')
var Message = require('../message')

var SetBlockValueCommand = function (id, value, clear) {
  Message.call(this)
  this.id = id
  this.value = value
  this.clear = clear
}

util.inherits(SetBlockValueCommand, Message)

SetBlockValueCommand.prototype.encodeBody = function () {
  return Buffer.concat([
    Message.Encoder.encodeID(this.id),
    this.clear ?
      new Buffer([ 0, 0 ]) :
      new Buffer([ this.value ])
  ])
}

module.exports = SetBlockValueCommand
