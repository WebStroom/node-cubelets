var test = require('tape')
var device = require('./config').device
var cubelets = require('../index')

test('responding', function (t) {
  t.plan(6)

  var GetConfigurationRequest = cubelets.Protocol.messages.GetConfigurationRequest

  cubelets.connect(device, function (err, client) {
    t.ifError(err, 'no connect err')
    t.pass('connect callback')
    client.sendRequest(new GetConfigurationRequest(), function (err, response) {
      t.ifError(err, 'no request err')
      t.ok(response, 'response ok')
      client.disconnect(function (err) {
        t.ifError(err, 'no disconnect err')
        t.pass('disconnected')
      })
    })
  })
})
