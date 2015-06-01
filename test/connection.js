var test = require('tape')
var device = require('./config').device
var cubelets = require('../index')

test('connecting', function (t) {
  t.plan(6)

  var connection

  cubelets.connect(device, function (err, client, con) {
    t.ifError(err, 'no err on connect')
    t.pass('connect callback')
    connection = con

    client.on('connect', function (con) {
      t.equal(con, connection)
      t.pass('client connect')
    })

    client.on('disconnect', function () {
      t.pass('client disconnect')
    })

    client.disconnect(function (err) {
      t.ifError(err, 'no err on disconnect')
    })
  })
})
