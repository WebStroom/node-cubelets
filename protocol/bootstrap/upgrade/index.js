var Protocol = require('../../protocol')
var Message = require('../../imago/message')
var Parser = require('../../parser')
var Strategy = require('./strategy')
var xtend = require('xtend/mutable')

var messages = {
  SetBootstrapModeRequest: require('./request/setBootstrapMode'),
  SetBootstrapModeResponse: require('./response/setBootstrapMode'),

  BlockFoundEvent: require('./event/blockFound'),
  DisconnectFailedEvent: require('./event/disconnectFailed'),
}

var UpgradeProtocol = new Protocol({
  commands: [
  ],
  requests: [
    [0xB1, messages.SetBootstrapModeRequest],
  ],
  responses: [
    [0xBF, messages.SetBootstrapModeResponse],
  ],
  events: [
    [0xB0, messages.BlockFoundEvent],
    [0xB2, messages.DisconnectFailedEvent]
  ]
})

UpgradeProtocol.messages = messages

xtend(UpgradeProtocol, {
  Message: Message,
  Parser: Parser.bind(null, UpgradeProtocol),
  Strategy: Strategy.bind(null, UpgradeProtocol)
})

module.exports = UpgradeProtocol
