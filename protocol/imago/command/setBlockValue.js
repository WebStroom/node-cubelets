var util = require('util')
var Message = require('../message')
var __ = require('underscore')

var SetBlockValueCommand = function (blocks) {
  Message.call(this)
  this.blocks = blocks
}

util.inherits(SetBlockValueCommand, Message)

SetBlockValueCommand.prototype.encodeBody = function () {
  return Buffer.concat(__(this.blocks).map(function (block) {
    return Buffer.concat([
      Message.Encoder.encodeID(block.id),
      new Buffer([ block.value ])
    ])
  }))
}

SetBlockValueCommand.prototype.prioritize = function (otherCommand) {
  if (otherCommand instanceof SetBlockValueCommand) {
    return 1
  } else {
    return 0
  }
}

module.exports = SetBlockValueCommand
