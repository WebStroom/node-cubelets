var test = require('tape')
var fs = require('fs')
var config = require('../config')
var cubelets = require('../../index')
var Block = require('../../block')
var BlockTypes = require('../../blockTypes')
var MCUTypes = require('../../mcuTypes')
var Upgrade = require('../../upgrade')
var ClassicProtocol = require('../../protocol/classic')
var Flash = ClassicProtocol.Flash
var Program = ClassicProtocol.Program

var bluetoothBlockId = config.map.type.bluetooth

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

      test('must detect classic firmware', function (t) {
        t.plan(3)
        upgrade.detectIfNeeded(function (err, needsUpgrade, firmwareType) {
          t.ifError(err, 'no err')
          t.ok(needsUpgrade, 'needs upgrade')
          t.equal(firmwareType, 0, 'has classic firmware')
        })
      })

      test('set classic protocol', function (t) {
        t.plan(1)
        client.setProtocol(ClassicProtocol)
        t.pass('set protocol')
      })

      test('flash bluetooth bootstrap firmware', function (t) {
        t.plan(2)
        var hex = fs.readFileSync('./upgrade/hex/bluetooth_bootstrap.hex')
        var program = new Program(hex)
        t.ok(program.valid, 'firmware valid')
        var block = new Block(bluetoothBlockId, 0, BlockTypes.BLUETOOTH)
        block._mcuType = MCUTypes.AVR
        var flash = new Flash(client, {
          skipSafeCheck: true
        })
        flash.programToBlock(program, block, function (err) {
          t.ifError(err, 'flash err')
        })
        flash.on('progress', function (e) {
          console.log('progress', '(' + e.progress + '/' + e.total + ')')
        })
      })

      test.skip('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
