var test = require('tape')
var cubelets = require('../index')

test('message codes', function (t) {
    t.plan(8)

    var Protocol = cubelets.Protocol
    var msg = Protocol.messages

    var SetBlockValueCommand = msg.SetBlockValueCommand
    t.equal(SetBlockValueCommand.code, 0x41)
    t.equal(new SetBlockValueCommand().code(), 0x41)

    var GetConfigurationRequest = msg.GetConfigurationRequest
    t.equal(GetConfigurationRequest.code, 0x01)
    t.equal(new GetConfigurationRequest().code(), 0x01)

    var GetConfigurationResponse = msg.GetConfigurationResponse
    t.equal(GetConfigurationResponse.code, 0x81)
    t.equal(new GetConfigurationResponse().code(), 0x81)

    var DebugEvent = msg.DebugEvent
    t.equal(DebugEvent.code, 0xE0)
    t.equal(new DebugEvent().code(), 0xE0)
})

test('linked message codes', function (t) {
    t.plan(2)

    var Protocol = cubelets.Protocol.Imago
    var msg = Protocol.messages

    var GetConfigurationRequest = msg.GetConfigurationRequest
    var GetConfigurationResponse = msg.GetConfigurationResponse
    t.equal(GetConfigurationResponse.code, Protocol.responseCodeForRequestCode(GetConfigurationRequest.code))
    t.equal(GetConfigurationRequest.code, Protocol.requestCodeForResponseCode(GetConfigurationResponse.code))
})
