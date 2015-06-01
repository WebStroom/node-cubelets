var Protocol = require('../../protocol')
var Message = require('./message')
var Parser = require('../parser')
var Strategy = require('./strategy')
var xtend = require('xtend/mutable')

var messages = {
  SetBlockLEDCommand: require('./command/setBlockLED'),
  SetBlockValueCommand: require('./command/setBlockValue'),
  ClearBlockValueCommand: require('./command/clearBlockValue'),
  GetNeighborBlocksCommand: require('./command/getNeighborBlocks'),
  RegisterBlockValueEventCommand: require('./command/registerBlockValueEvent'),
  UnregisterBlockValueEventCommand: require('./command/unregisterBlockValueEvent'),
  UnregisterAllBlockValueEventsCommand: require('./command/unregisterAllBlockValueEvents'),
  ResetCommand: require('./command/reset'),
  KeepAliveRequest: require('./request/keepAlive'),
  KeepAliveResponse: require('./response/keepAlive'),
  BlockValueEvent: require('./event/blockValue'),
  GetNeighborBlocksEvent: require('./event/getNeighborBlocks'),
  FlashProgressEvent: require('./event/flashProgress'),
  FlashCompleteEvent: require('./event/flashComplete')
}

var ClassicProtocol = new Protocol({
  commands: [
    ['e', messages.SetBlockLEDCommand],
    ['s', messages.SetBlockValueCommand],
    ['t', messages.ClearBlockValueCommand],
    ['m', messages.GetNeighborBlocksCommand],
    ['b', messages.RegisterBlockValueEventCommand],
    ['u', messages.UnregisterBlockValueEventCommand],
    ['q', messages.UnregisterAllBlockValueEventsCommand],
    ['x', messages.ResetCommand]
  ],
  requests: [
    ['a', messages.KeepAliveRequest]
  ],
  responses: [
    ['l', messages.KeepAliveResponse]
  ],
  events: [
    ['b', messages.BlockValueEvent],
    ['n', messages.GetNeighborBlocksEvent],
    ['U', messages.FlashProgressEvent],
    ['X', messages.FlashCompleteEvent]
  ]
})

ClassicProtocol.messages = messages

xtend(ClassicProtocol, {
  Message: Message,
  Parser: Parser.bind(null, ClassicProtocol),
  Strategy: Strategy.bind(null, ClassicProtocol)
})

module.exports = ClassicProtocol
