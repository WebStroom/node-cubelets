var Protocol = require('../protocol')

var messages = {
  SetValueCommand: require('../block/command/setValue'),
  SetLEDCommand: require('../block/command/setLED'),
  GetConfigurationRequest: require('../block/request/getConfiguration'),
  GetConfigurationResponse: require('../block/response/getConfiguration'),
  GetNeighborsRequest: require('../block/request/getNeighbors'),
  GetNeighborsResponse: require('../block/response/getNeighbors'),
  PingRequest: require('../block/request/ping'),
  PongResponse: require('../block/response/pong'),
  JumpCommand: require('../block/command/jump'),
  PathCommand: require('../block/command/path'),
}

module.exports = new Protocol({
  commands: [
    [0x70, messages.SetValueCommand],
    [0x71, messages.SetLEDCommand],
    [0x80, messages.JumpCommand],
    [0xA0, messages.PathCommand]
  ],
  requests: [
    [0x72, messages.GetConfigurationRequest],
    [0x74, messages.GetNeighborsRequest],
    [0x76, messages.PingRequest],
  ],
  responses: [
    [0x73, messages.GetConfigurationResponse],
    [0x75, messages.GetNeighborsResponse],
    [0x77, messages.PongResponse],
  ],
  events: []
})

module.exports.messages = messages
