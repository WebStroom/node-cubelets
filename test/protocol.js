var test = require('tape')
var cubelets = require('../index')
 
test('message codes', function (t) {
    t.plan(8)

    var Protocol = cubelets.Protocol

    var SetBlockValueCommand = cubelets.SetBlockValueCommand
    t.equal(SetBlockValueCommand.code, 0x41)
    t.equal(new SetBlockValueCommand().code(), 0x41)

    var GetConfigurationRequest = cubelets.GetConfigurationRequest
    t.equal(GetConfigurationRequest.code, 0x01)
    t.equal(new GetConfigurationRequest().code(), 0x01)

    var GetConfigurationResponse = cubelets.GetConfigurationResponse
    t.equal(GetConfigurationResponse.code, 0x71)
    t.equal(new GetConfigurationResponse().code(), 0x71)

    var DebugEvent = cubelets.DebugEvent
    t.equal(DebugEvent.code, 0xF0)
    t.equal(new DebugEvent().code(), 0xF0)
})

test('linked message codes', function (t) {
    t.plan(2)

    var Protocol = cubelets.Protocol
    var GetConfigurationRequest = cubelets.GetConfigurationRequest
    var GetConfigurationResponse = cubelets.GetConfigurationResponse
    t.equal(GetConfigurationResponse.code, Protocol.responseCodeForRequestCode(GetConfigurationRequest.code))
    t.equal(GetConfigurationRequest.code, Protocol.requestCodeForResponseCode(GetConfigurationResponse.code))
})
