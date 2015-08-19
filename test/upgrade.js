var test = require('tape')
var fs = require('fs')
var config = require('./config')
var cubelets = require('../index')
var Upgrade = require('../upgrade')
var Firmware = require('../protocol/classic/firmware')
var Program = require('../protocol/classic/program')
var Block = require('../block')
var BlockTypes = require('../blockTypes')
var MCUTypes = require('../mcuTypes')
var UpgradeProtocol = require('../protocol/bootstrap/upgrade')
var ImagoProtocol = require('../protocol/imago')
var ClassicProtocol = require('../protocol/classic')

var blockIds = {
  bluetooth: config.map.type.bluetooth
}

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      var upgrade = new Upgrade(client)

      test.skip('jump to OS4 mode', function (t) {
        t.plan(2)
        client.setProtocol(UpgradeProtocol)
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(1), function (err, response) {
          t.ifError(err)
          t.equals(response.mode, 1)
        })
      })

      test.skip('jump to discovery mode from OS4', function (t) {
        t.plan(1)

        var timeout

        client.setProtocol(ImagoProtocol)
        client.sendCommand(new ImagoProtocol.messages.ResetCommand())
        setTimeout(function () {
          var listener = function (e) {
            if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
              clearTimeout(timeout)
              client.removeListener('event', listener)
              clearTimeout(timeout)
              t.pass('Jumped to discovery from OS4')
            }
          }

          // Listen for BlockFoundEvents
          client.on('event', listener)

          // Change to to Upgrade/Discovery Protocol
          client.setProtocol(UpgradeProtocol)

          // Timeout of we don't receive a BlockFoundEvent in specified time
          timeout = setTimeout(function () {
            // Detach from even emitter
            client.removeListener('event', listener)
            t.fail('Failed to jump to discovery from OS4')
          }, 1000)
        }, 500)
      })

      test.skip('jump to OS3 mode', function (t) {
        t.plan(2)
        client.setProtocol(UpgradeProtocol)
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(0), function (err, response) {
          t.ifError(err)
          t.equals(response.mode, 0)
        })
      })

      test.skip('jump to discovery mode from OS3', function (t) {
        t.plan(1)

        var timeout

        client.setProtocol(ClassicProtocol)
        client.sendCommand(new ClassicProtocol.messages.ResetCommand())
        setTimeout(function () {
          var listener = function (e) {
            if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
              clearTimeout(timeout)
              client.removeListener('event', listener)
              clearTimeout(timeout)
              t.pass('Jumped to discovery from OS4')
            }
          }

          // Listen for BlockFoundEvents
          client.on('event', listener)

          // Change to to Upgrade/Discovery Protocol
          client.setProtocol(UpgradeProtocol)

          // Timeout of we don't receive a BlockFoundEvent in specified time
          timeout = setTimeout(function () {
            // Detach from even emitter
            client.removeListener('event', listener)
            t.fail('Failed to jump to discovery from OS3')
          }, 1000)
        }, 500)
      })

      var os3_face
      test.skip('Detect OS3 (or prior) Cubelet', function (t) {
        t.plan(1)
        var listener = function (e) {
          if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
            if (e.firmwareType === 0) { // If non-imago Cubelet was discovered
              os3_face = e.faceIndex
              client.removeListener('event', listener)
              t.pass('Detected OS3 Cubelet on face: ' + os3_face)
            }
          }
        }

        // Listen for BlockFoundEvents
        client.on('event', listener)
      })

      test.skip('jump to OS3 mode', function (t) {
        t.plan(2)
        client.setProtocol(UpgradeProtocol)
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(0), function (err, response) {
          t.ifError(err)
          t.equals(response.mode, 0)
        })
      })

      var os3_id
      test.skip('request OS3 map', function (t) {
        t.plan(2)
        client.setProtocol(ClassicProtocol)
        setTimeout(function () {
          client.sendRequest(new ClassicProtocol.messages.GetNeighborBlocksRequest(), function (err, response) {
            t.ifError(err)

            var neighbor_key = '' + os3_face
            if (neighbor_key in response.neighbors) {
              os3_id = response.neighbors[neighbor_key]
              t.pass('Found OS3 Cubelet w/ ID: ' + os3_id + ' on face: ' + neighbor_key)
            } else {
              t.fail('Did not find an OS3 neighbor.')
            }
          })
        }, 500)
      })

      test('flash bluetooth bootstrap firmware', function (t) {
        t.plan(2)
        var hex = fs.readFileSync('./upgrade/hex/bluetooth_bootstrap.hex')
        var program = new Program(hex)
        t.ok(program.valid, 'firmware valid')
        var firmware = new Firmware(program, client)
        var block = new Block(blockIds.bluetooth, 0, BlockTypes.BLUETOOTH)
        block._mcuType = MCUTypes.AVR
        client.setProtocol(ClassicProtocol)
        firmware.flashToBlock(block, function (err) {
          t.ifError(err, 'flash err')
        })
        firmware.on('progress', function (e) {
          console.log('progress', '(' + e.progress + '/' + e.total + ')')
        })
      })

      // Additional Tests:
      // Failed to disconnect message

      // Flash tests missing:
      // Fetch type and version from datastore
      // Flash pic bootstrap+bootloader
      // Confirm flash success
      // Send reset (OS3)
      // Wait
      // Make sure imago block shows up on same face
      // Jump to imago
      // Flash imago application
      // Verify success
      // Send reset (OS4)

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
