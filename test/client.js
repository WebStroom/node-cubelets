var test = require('tape')
var cubelets = require('../index')

// var Client = require('../client/chrome')
// var device = require('./config.json')['chrome']
var Client = require('../client/serial')
var device = require('./config.json')['serial']

test('client', function (t) {
  t.plan(7)

  var cl = new Client()

  var cn = cl.connect(device, function (err) {
    t.error(err, 'no err on connect')
    t.pass('connect callback')
  })

  cl.on('connection', function (connection) {
    t.equal(cn, connection)
    t.pass('client connection')
  })

  cn.on('connect', function () {
    t.pass('connection connect')

    cn.on('disconnect', function () {
      t.pass('connection disconnect')
    })

    cn.disconnect(function (err) {
      t.error(err, 'no err on disconnect')
    })
  })
})

test('responding', function (t) {
  t.plan(4)

  var cn = new Client.Connection(device)
  var GetConfigurationRequest = cubelets.GetConfigurationRequest

  cn.connect(function (err) {
    t.pass('connected')
    cn.sendRequest(new GetConfigurationRequest(), function (err, response) {
      t.error(err)
      t.ok(response, 'got response')

      cn.disconnect(function () {
        t.pass('disconnected')
      })
    })
  })
})

test('construction', function (t) {
  t.plan(3)
  //1 connected
  //2 added a cubelet
  //3 removed a cubelet

  var cn = new Client().connect(device, function (err, construction) {
    t.pass('connected')
    var c = construction
    construction.discover(function (map) {
      var m = map
      m.on('change', function (added, removed) {
        // test add or remove nodes
        if (added.length > 0) t.pass('added cubelet')
        if (removed.length > 0) t.pass('removed cubelet')
      })
    })
  })
})
