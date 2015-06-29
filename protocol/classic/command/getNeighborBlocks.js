var util = require('util')
var Message = require('../message')

var GetNeighborBlocksCommand = function (id, value) {
  Message.call(this)
}

util.inherits(GetNeighborBlocksCommand, Message)

module.exports = GetNeighborBlocksCommand
