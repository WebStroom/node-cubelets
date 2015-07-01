var util = require('util')
var Message = require('../message')
var __ = require('underscore')

var ClearBlockValueCommand = function (blocks) {
  Message.call(this)
  this.blocks = blocks
}

util.inherits(ClearBlockValueCommand, Message)

ClearBlockValueCommand.prototype.encodeBody = function () {
  return Buffer.concat(__(this.blocks).map(function (block) {
    return Message.Encoder.encodeID(block.id)
  }))
}

ClearBlockValueCommand.prototype.prioritize = function (otherCommand) {
  if (otherCommand instanceof ClearBlockValueCommand) {
    return 1
  } else {
    return 0
  }
}

module.exports = ClearBlockValueCommand
