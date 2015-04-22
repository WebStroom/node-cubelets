var Protocol = require('../protocol')
var xtend = require('xtend/mutable')

var messages = {
  SetBlockValueCommand: require('../command/setBlockValue'),
  SetLEDColorCommand: require('../command/setLEDColor'),
  GetConfigurationRequest: require('../request/getConfiguration'),
  GetConfigurationResponse: require('../response/getConfiguration'),
  GetModeRequest: require('../request/getMode'),
  GetModeResponse: require('../response/getMode'),
  SetModeRequest: require('../request/setMode'),
  SetModeResponse: require('../response/setMode'),
  GetBlockValueRequest: require('../request/getBlockValue'),
  GetBlockValueResponse: require('../response/getBlockValue'),
  RegisterBlockValueEventRequest: require('../request/registerBlockValueEvent'),
  RegisterBlockValueEventResponse: require('../response/registerBlockValueEvent'),
  UnregisterBlockValueEventRequest: require('../request/unregisterBlockValueEvent'),
  UnregisterBlockValueEventResponse: require('../response/unregisterBlockValueEvent'),
  GetNeighborhoodRequest: require('../request/getNeighborhood'),
  GetNeighborhoodResponse: require('../response/getNeighborhood'),
  VisitNeighborRequest: require('../request/visitNeighbor'),
  VisitNeighborResponse: require('../response/visitNeighbor'),
  EchoRequest: require('../request/echo'),
  EchoResponse: require('../response/echo'),
  DebugEvent: require('../event/debug'),
  BlockValueEvent: require('../event/blockValue'),
  FlashProgressEvent: require('../event/flashProgress')
}

module.exports = new Protocol({
  commands: [
    [0x41, messages.SetBlockValueCommand],
    [0x42, messages.SetLEDColorCommand]
  ],
  requests: [
    [0x01, messages.GetConfigurationRequest],
    [0x02, messages.GetModeRequest],
    // [0x03, messages.SetModeRequest],
    [0x04, messages.GetBlockValueRequest],
    [0x05, messages.RegisterBlockValueEventRequest],
    // [0x06, messages.UnregisterBlockValueEventRequest],
    // [0x08, messages.VisitNeighborRequest],
    [0x10, messages.GetNeighborhoodRequest],
    [0x20, messages.EchoRequest]
  ],
  responses: [
    [0x71, messages.GetConfigurationResponse],
    [0x72, messages.GetModeResponse],
    // [0x73, messages.SetModeResponse],
    [0x74, messages.GetBlockValueResponse],
    [0x75, messages.RegisterBlockValueEventResponse],
    // [0x76, messages.UnregisterBlockValueEventResponse],
    // [0x78, messages.VisitNeighborResponse],
    [0x80, messages.GetNeighborhoodResponse],
    [0x90, messages.EchoResponse]
  ],
  events: [
    [0xF0, messages.DebugEvent],
    [0xF1, messages.BlockValueEvent],
    [0xF2, messages.FlashProgressEvent]
  ]
})

module.exports.merge = function (obj) {
  var merged = xtend(obj, messages)
  module.exports.messages = messages
  return merged
}
