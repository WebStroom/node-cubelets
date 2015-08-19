var test = require('tape')
var fs = require('fs')
var config = require('./config')
var cubelets = require('../index')
var Firmware = require('../protocol/classic/firmware')
var Program = require('../protocol/classic/program')
var Block = require('../block')
var BlockTypes = require('../blockTypes')
var MCUTypes = require('../mcuTypes')
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

      test('must set protocol', function (t) {
        t.plan(1)
        client.setProtocol(cubelets.Protocol.Classic)
        t.pass('set protocol')
      })

      test.skip('get neighbors', function (t) {
        t.plan(5)
        client.fetchNeighborBlocks(function (err, neighborBlocks) {
          t.ifError(err, 'no error')
          t.ok(neighborBlocks.length > 0, 'should be at least 1 neighbor')
          t.ok(client.getNeighborBlocks().length > 0, 'get neighbor blocks')
          t.ok(client.getAllBlocks().length > 0, 'get all blocks')
          t.ok(client.getOriginBlock(), 'should also get origin block')
        })
      })

      test.skip('get all neighbors', function (t) {
        t.plan(4)
        client.fetchAllBlocks(function (err, allBlocks) {
          t.ifError(err, 'no error')
          t.ok(allBlocks.length > 0, 'should be at least 1 block')
          t.ok(client.getAllBlocks().length > 0, 'get all blocks')
          t.ok(client.getOriginBlock(), 'should also get origin block')
        })
      })

      test('flash bluetooth firmware', function (t) {
        t.plan(2)
        var hex = fs.readFileSync('./hex/bluetooth.hex')
        var program = new Program(hex)
        t.ok(program.valid, 'firmware valid')
        var firmware = new Firmware(program, client)
        var block = new Block(167058, 0, BlockTypes.BLUETOOTH)
        block._mcuType = MCUTypes.AVR
        firmware.on('progress', function (e) {
          console.log('progress', e.progress + '/' + e.total)
        })
        firmware.flashToBlock(block, function (err) {
          t.ifError(err, 'flash err')
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
