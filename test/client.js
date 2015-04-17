var test = require('tape')
var cubelets = require('../index')
var Client = require('../client/serial')
var config = require('./config.json')['serial']

test('connection', function (t) {
  t.plan(4)

  var client = new Client(config)

  client.connect(function (err) {
    t.error(err)
  })

  client.on('connect', function () {
    t.pass('connected')

    client.on('disconnect', function () {
      t.pass('disconnected')
    })

    client.disconnect(function (err) {
      t.error(err)
    })
  })
})

test('responding', function (t) {
  t.plan(4)

  var client = new Client(config)
  var GetConfigurationRequest = cubelets.GetConfigurationRequest

  client.connect(function (err) {
    t.pass('connected')
    client.sendRequest(new GetConfigurationRequest(), function (err, response) {
      t.error(err)
      t.ok(response, 'got response')

      client.disconnect(function () {
        t.pass('disconnected')
      })
    })
  })
})
