var test = require('tape')
var fs = require('fs')
var config = require('./config')
var cubelets = require('../index')
var Firmware = require('../firmware/classic')
var InfoService = require('../services/info')
var FirmwareService = require('../services/firmware')
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
        client.setProtocol(cubelets.Protocol.Classic)
        t.pass('set protocol')
      })

      test('get neighbors', function (t) {
        t.plan(5)
        client.fetchNeighborBlocks(function (err, neighborBlocks) {
          t.ifError(err, 'no error')
          t.ok(neighborBlocks.length > 0, 'should be at least 1 neighbor')
          t.ok(client.getNeighborBlocks().length > 0, 'get neighbor blocks')
          t.ok(client.getAllBlocks().length > 0, 'get all blocks')
          t.ok(client.getOriginBlock(), 'should also get origin block')
        })
      })

      test('get all neighbors', function (t) {
        t.plan(5)
        client.fetchAllBlocks(function (err, allBlocks) {
          t.ifError(err, 'no error')
          t.ok(allBlocks.length > 0, 'should be at least 1 block')
          t.ok(client.getNeighborBlocks().length > 0, 'get neighbor blocks')
          t.ok(client.getAllBlocks().length > 0, 'get all blocks')
          t.ok(client.getOriginBlock(), 'should also get origin block')
        })
      })

      test('flash bluetooth firmware', function (t) {
        var hex = fs.readFileSync('./hex/bluetooth.hex')
        var program = new Program(hex)
        var firmware = new Firmware(program, client)
        firmware.flashToBlock(client.getOriginBlock())
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
