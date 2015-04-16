var test = require('tape')
var cubelets = require('../index')
var config = require('./config.json')

/****
test('connection', function (t) {
  t.plan(4)

  var client = new cubelets.SerialClient(config['serial'])

  client.connect(function (err) {
    t.error(err)
  })

  client.on('connect', function () {
    t.pass('client connected')

    client.on('disconnect', function () {
      t.pass('client disconnected')
    })

    client.disconnect(function (err) {
      t.error(err)
    })
  })
})
****/

test('responding', function (t) {
  t.plan(3)

  var client = new cubelets.SerialClient(config['serial'])
  var GetConfigurationRequest = cubelets.GetConfigurationRequest

  client.connect(function (err) {

    client.sendRequest(new GetConfigurationRequest(), function (err, response) {
      t.error(err)
      t.ok(response, 'got response')

      client.disconnect(function () {
        t.pass('disconnected')
      }
    })

  })
})