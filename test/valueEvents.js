var fs = require('fs')
var test = require('tape')
var config = require('./config')
var cubelets = require('../index')

var blockIds = {
  flashlight: config.construction.type.flashlight,
  bargraph: config.construction.type.bargraph
}

test('connect', function (t) {
  t.plan(1)

  var client = cubelets.connect(config.device, function (err) {
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('register block value events', function (t) {
        t.plan(2)
        client.registerBlockValueEvent(blockIds.flashlight, t.ifError)
        client.registerBlockValueEvent(blockIds.bargraph, t.ifError)
      })

      test('unregister block value events', function (t) {
        t.plan(3)
        client.unregisterBlockValueEvent(blockIds.flashlight, t.ifError)
        client.unregisterBlockValueEvent(blockIds.bargraph, t.ifError)
        setTimeout(function () {
          function onEvent(e) {
            if (e instanceof cubelets.Protocol.messages.BlockValueEvent) {
              t.fail('unregister')
            }            
          }
          client.on('event', onEvent)
          setTimeout(function () {
            client.removeListener('event', onEvent)
            t.pass('unregister')
          }, 2000)
        }, 2000)
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
