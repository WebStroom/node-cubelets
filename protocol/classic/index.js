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

function code(c) {
  return c.charCodeAt(0)
}

var ClassicProtocol = new Protocol({
  commands: [
    [code('e'), messages.SetBlockLEDCommand],
    [code('s'), messages.SetBlockValueCommand],
    [code('t'), messages.ClearBlockValueCommand],
    [code('m'), messages.GetNeighborBlocksCommand],
    [code('b'), messages.RegisterBlockValueEventCommand],
    [code('u'), messages.UnregisterBlockValueEventCommand],
    [code('q'), messages.UnregisterAllBlockValueEventsCommand],
    [code('x'), messages.ResetCommand]
  ],
  requests: [
    [code('a'), messages.KeepAliveRequest]
  ],
  responses: [
    [code('l'), messages.KeepAliveResponse]
  ],
  events: [
    [code('b'), messages.BlockValueEvent],
    [code('n'), messages.GetNeighborBlocksEvent],
    [code('U'), messages.FlashProgressEvent],
    [code('X'), messages.FlashCompleteEvent]
  ]
})

ClassicProtocol.messages = messages

xtend(ClassicProtocol, {
  Message: Message,
  Parser: Parser.bind(null, ClassicProtocol),
  Strategy: Strategy.bind(null, ClassicProtocol)
})

module.exports = ClassicProtocol
