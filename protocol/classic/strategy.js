var util = require('util')
var Strategy = require('../strategy')

function ClassicStrategy(protocol, client) {
  Strategy.call(this, protocol, client)

  var messages = protocol.messages

  this.ping = function (callback, timeout) {
    client.sendRequest(new messages.KeepAliveRequest(), callback, timeout)
  }
}

util.inherits(ClassicStrategy, Strategy)
module.exports = ClassicStrategy
