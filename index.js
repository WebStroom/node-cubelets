var cubelets = module.exports

cubelets.SetBlockValueCommand = require('./command/setBlockValue'),
cubelets.SetLEDColorCommand = require('./command/setLEDColor')

cubelets.GetConfigurationRequest = require('./request/getConfiguration')
cubelets.GetConfigurationResponse = require('./response/getConfiguration')
cubelets.GetModeRequest = require('./request/getMode')
cubelets.GetModeResponse = require('./response/getMode')
cubelets.SetModeRequest = require('./request/setMode')
cubelets.SetModeResponse = require('./response/setMode')
cubelets.GetBlockValueRequest = require('./request/getBlockValue')
cubelets.GetBlockValueResponse = require('./response/getBlockValue')
cubelets.RegisterBlockValueEventRequest = require('./request/registerBlockValueEvent')
cubelets.RegisterBlockValueEventResponse = require('./response/registerBlockValueEvent')
cubelets.UnregisterBlockValueEventRequest = require('./request/unregisterBlockValueEvent')
cubelets.UnregisterBlockValueEventResponse = require('./response/unregisterBlockValueEvent')
cubelets.GetNeighborhoodRequest = require('./request/getNeighborhood')
cubelets.GetNeighborhoodResponse = require('./response/getNeighborhood')
cubelets.VisitNeighborRequest = require('./request/visitNeighbor')
cubelets.VisitNeighborResponse = require('./response/visitNeighbor')
cubelets.EchoRequest = require('./request/echo')
cubelets.EchoResponse = require('./response/echo')

cubelets.DebugEvent = require('./event/debug')
cubelets.BlockValueEvent = require('./event/blockValue')
cubelets.FlashProgressEvent = require('./event/flashProgress')

cubelets.Protocol = require('./protocol')({
  commands: [
    [0x41, cubelets.SetBlockValueCommand],
    [0x42, cubelets.SetLEDColorCommand]
  ],
  requests: [
    [0x01, cubelets.GetConfigurationRequest],
    [0x02, cubelets.GetModeRequest],
    [0x03, cubelets.SetModeRequest],
    [0x04, cubelets.GetBlockValueRequest],
    [0x05, cubelets.RegisterBlockValueEventRequest],
    [0x06, cubelets.UnregisterBlockValueEventRequest],
    [0x07, cubelets.GetNeighborhoodRequest],
    [0x08, cubelets.VisitNeighborRequest],
    [0x20, cubelets.EchoRequest]
  ],
  responses: [
    [0x71, cubelets.GetConfigurationResponse],
    [0x72, cubelets.GetModeResponse],
    [0x73, cubelets.SetModeResponse],
    [0x74, cubelets.GetBlockValueResponse],
    [0x75, cubelets.RegisterBlockValueEventResponse],
    [0x76, cubelets.UnregisterBlockValueEventResponse],
    [0x77, cubelets.GetNeighborhoodResponse],
    [0x78, cubelets.VisitNeighborResponse],
    [0x80, cubelets.EchoResponse]
  ],
  events: [
    [0xF0, cubelets.DebugEvent],
    [0xF1, cubelets.BlockValueEvent],
    [0xF2, cubelets.FlashProgressEvent]
  ]
})

cubelets._Parser = require('./parser')
cubelets._Client = require('./client')
cubelets.SerialClient = require('./client/serial')
cubelets.BluetoothSerialClient = require('./client/bluetoothSerial')
cubelets.ChromeClient = require('./client/chrome')
