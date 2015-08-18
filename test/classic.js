var test = require('tape')
var config = require('./config')
var cubelets = require('../index')
var Upgrade = require('../upgrade')
var __ = require('underscore')

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('can set protocol', function (t) {
        t.plan(1)
        client.setProtocol(cubelets.Protocol.Imago)
        t.pass('set protocol')
      })

      test('get neighbors', function (t) {
        t.plan(3)
        client.fetchNeighborBlocks(function (err, neighborBlocks) {
          t.ifError(err, 'no error')
          t.ok(neighborBlocks.length > 0, 'should be at least 1 neighbor')
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
