var util = require('util')
var Message = require('../message')
var __  = require('underscore')

var PathCommand = function (id, seq, loop) {
  Message.call(this, id)
  this.seq = seq
  this.loop = loop
}

util.inherits(PathCommand, Message)

PathCommand.prototype.encodeBody = function () {
  return Buffer.concat([]
    .concat(__(this.seq).map(Message.Encoder.encodeID))
    .concat([ new Buffer([ this.loop ? 1 : 0 ]) ]))
}

module.exports = PathCommand
