var util = require('util')
var Strategy = require('../../strategy')

function ClassicStrategy(protocol, client) {
  Strategy.call(this, protocol, client)

  var messages = protocol.messages

  this.keepAlive = function (callback) {
    client.sendRequest(new messages.KeepAliveRequest(), callback)
  }

  this.clearBlockValue = function (id, callback) {
    client.sendRequest(new messages.ClearBlockValueCommand(id), callback)
  }
}

util.inherits(ClassicStrategy, Strategy)
module.exports = ClassicStrategy
