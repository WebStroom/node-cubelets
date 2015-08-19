var test = require('tape')
var fs = require('fs')
var config = require('../config')
var cubelets = require('../../index')
var Firmware = require('../../protocol/classic/firmware')
var Program = require('../../protocol/classic/program')
var Block = require('../../block')
var BlockTypes = require('../../blockTypes')
var MCUTypes = require('../../mcuTypes')
var Upgrade = require('../../upgrade')

// Note: block should start this test with 
// classic firwmare running. It will upgrade the block
// to the bootstrap firmware.
var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      var upgrade = new Upgrade(client)

      test('detect classic firmware', function (t) {
        t.plan(3)
        upgrade.detectIfNeeded(function (err, needsUpgrade, firmwareType) {
          t.ifError(err, 'no err')
          t.ok(needsUpgrade, 'needs upgrade')
          t.equal(firmwareType, 0, 'has classic firmware')
        })
      })

      test('must set protocol', function (t) {
        t.plan(1)
        client.setProtocol(cubelets.Protocol.Classic)
        t.pass('set protocol')
      })

      test('flash bluetooth bootstrap firmware', function (t) {
        t.plan(2)
        var hex = fs.readFileSync('./upgrade/hex/bluetooth_bootstrap.hex')
        var program = new Program(hex)
        t.ok(program.valid, 'firmware valid')
        var firmware = new Firmware(program, client)
        var block = new Block(167058, 0, BlockTypes.BLUETOOTH)
        block._mcuType = MCUTypes.AVR
        firmware.flashToBlock(block, function (err) {
          t.ifError(err, 'flash err')
        })
        firmware.on('progress', function (e) {
          console.log('progress', '(' + e.progress + '/' + e.total + ')')
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
