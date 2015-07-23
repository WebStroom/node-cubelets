var util = require('util')
var Message = require('../message')

var GetNeighborBlocksCommand = function () {
  Message.call(this)
}

util.inherits(GetNeighborBlocksCommand, Message)

module.exports = GetNeighborBlocksCommand
