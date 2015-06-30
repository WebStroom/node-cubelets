var util = require('util')
var Message = require('../message')
var __ = require('underscore')

var SetManyBlockValuesCommand = function (blocks) {
  Message.call(this)
  this.blocks = blocks
}

util.inherits(SetManyBlockValuesCommand, Message)

SetManyBlockValuesCommand.prototype.encodeBody = function () {
  return Buffer.concat(__(this.blocks).map(function (block) {
    return Buffer.concat([
      Message.Encoder.encodeID(block.id),
      new Buffer([ block.value ])
    ])
  }))
}

SetManyBlockValuesCommand.prototype.prioritize = function (otherCommand) {
  if (otherCommand instanceof SetManyBlockValuesCommand) {
    return 1
  } else {
    return 0
  }
}

module.exports = SetManyBlockValuesCommand
