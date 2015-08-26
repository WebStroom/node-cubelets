var test = require('tape')
var fs = require('fs')
var config = require('../config')
var cubelets = require('../../index')
var Block = require('../../block')
var BlockTypes = require('../../blockTypes')
var MCUTypes = require('../../mcuTypes')
var UpgradeProtocol = require('../../protocol/bootstrap/upgrade')
var Upgrade = require('../../upgrade')
var ImagoProtocol = require('../../protocol/imago')
var ImagoProgram = ImagoProtocol.Program
var ImagoFlash = ImagoProtocol.Flash
var ClassicProtocol = require('../../protocol/classic')
var ClassicProgram = ClassicProtocol.Program
var ClassicFlash = ClassicProtocol.Flash
var InfoService = require('../../services/info')
var FirmwareService = require('../../services/firmware')
var __ = require('underscore')
var Version = require("../../version")

var FirmwareType = {
  CLASSIC: 0,
  IMAGO: 1,
  BOOTSTRAP: 2
}

var bluetoothBlockId = config.map.type.bluetooth
var firmwareService = new FirmwareService()

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      var upgrade = new Upgrade(client)
      var firmwareType
      var targetBlock

      test('Check Bluetooth firmware version', function (t) {
        t.plan(1)
        // Switch to the classic protocol
        client.setProtocol(ClassicProtocol)
        // Send a keep alive request to test how the cubelet responds
        client.sendRequest(new ClassicProtocol.messages.KeepAliveRequest(), function (err, response) {
          if (err) {
            // The imago protocol will fail to respond.
            firmwareType = FirmwareType.IMAGO
          }
          else if (response.payload.length > 0) {
            // The bootstrap protocol will differentiate itself by
            // sending an extra byte in the response.
            firmwareType = FirmwareType.BOOTSTRAP
          } else {
            // Otherwise, the cubelet has classic firmware.
            firmwareType = FirmwareType.CLASSIC
          }
          t.pass('Detected the Bluetooth firmware version')
        })
      })

      test('Update BT firmware if necessary', function (t) {
        // Make sure we are in bootstrap mode
        switch (firmwareType) {
          case FirmwareType.IMAGO:
            // Flash bootstrap firmware
            client.setProtocol(ImagoProtocol)
            var hex = fs.readFileSync('./upgrade/hex/bluetooth_bootstrap.hex')
            var program = new ImagoProgram(hex)
            t.ok(program.valid, 'firmware valid')
            var block = new Block(bluetoothBlockId, 0, BlockTypes.BLUETOOTH)

            block._mcuType = MCUTypes.AVR
            var flash = new ImagoFlash(client, {
              skipSafeCheck: true
            })
            var timer
            flash.programToBlock(program, block, function (err) {
              t.ifError(err, 'flash err')
              t.pass('Flashed bootstrap firmware')
              t.end()
            })
            flash.on('progress', function (e) {
              console.log('progress', '(' + e.progress + '/' + e.total + ')')
            })
            break
          case FirmwareType.BOOTSTRAP:
            t.pass('BT already running bootstrap no need to update')
            t.end()
            return
            break
          case FirmwareType.CLASSIC:
            // Flash bootstrap firmware
            t.ok(true, 'Need to flash bootstrap firmware')
            client.setProtocol(ClassicProtocol)
            var hex = fs.readFileSync('./upgrade/hex/bluetooth_bootstrap.hex')
            var program = new ClassicProgram(hex)
            t.ok(program.valid, 'firmware valid')
            var block = new Block(bluetoothBlockId, 0, BlockTypes.BLUETOOTH)

            block._mcuType = MCUTypes.AVR
            var flash = new ClassicFlash(client, {
              skipSafeCheck: true
            })
            var timer
            flash.programToBlock(program, block, function (err) {
              t.ifError(err, 'flash err')
              t.pass('Flashed bootstrap firmware')
              t.end()
            })
            flash.on('progress', function (e) {
              console.log('progress', '(' + e.progress + '/' + e.total + ')')
            })
            break
        }
      })

      test('in discovery mode receiving packets', function (t) {
        t.plan(1)
        client.setProtocol(UpgradeProtocol)
        var timer = setTimeout(function () {
          client.removeListener('event', waitForBlockEvent)
          t.fail('no block found events')
        }, 1000)
        function waitForBlockEvent (e) {
          if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
            clearTimeout(timer)
            client.removeListener('event', waitForBlockEvent)
            t.pass('got a block found event')
          }
        }
        client.on('event', waitForBlockEvent)
      })

      test('jump to os4', function (t) {
        t.plan(2)
        client.setProtocol(UpgradeProtocol)
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(1), function (err, response) {
          t.ifError(err)
          t.equals(response.mode, 1, 'jumped to os4')          
        })
      })

      test('find os4 target block and flash bootloader', function (t) {
        t.plan(4)
        client.setProtocol(ImagoProtocol)
        client.fetchNeighborBlocks(function (err, neighborBlocks) {
          t.ifError(err, 'req ok')
          t.ok(neighborBlocks.length > 0, 'found at least one neighbor')
          targetBlock = neighborBlocks[0]
          targetBlock._mcuType = MCUTypes.PIC

          var blockId = targetBlock.getBlockId()
          var faceIndex = targetBlock.getFaceIndex()

          var hex = fs.readFileSync('./downgrade/pic_downgrader.hex')
          var program = new ImagoProgram(hex)
          t.ok(program.valid, 'firmware valid')
          var flash = new ImagoFlash(client)
          flash.programToBlock(program, targetBlock, function (err) {
            t.ifError(err, 'flashed block')
          })
          flash.on('progress', function (e) {
            console.log('progress', '(' + e.progress + '/' + e.total + ')')
          })
        })
      })

      test('jump to discovery mode', function (t) {
        t.plan(1)
        client.sendCommand(new ImagoProtocol.messages.ResetCommand())
        setTimeout(function () {
          client.setProtocol(UpgradeProtocol)
          var timer = setTimeout(function () {
            client.removeListener('event', waitForBlockEvent)
            t.fail('no block found events')
            t.end()
          }, 3000)
          function waitForBlockEvent (e) {
            if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
              clearTimeout(timer)
              client.removeListener('event', waitForBlockEvent)
              t.pass('jumped back to discovery')
              t.end()
            }
          }
          client.on('event', waitForBlockEvent)
        })
      })

      test('jump to os3', function (t) {
        t.plan(2)
        client.setProtocol(UpgradeProtocol)
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(0), function (err, response) {
          client.setProtocol(ClassicProtocol)
          t.ifError(err)
          t.equals(response.mode, 0, 'jumped to os3')
        })
      })

      var testHex

      test('fetch info for block', function (t) {
        t.plan(6)

        var infoService = new InfoService()
        infoService.fetchBlockInfo([targetBlock], function (err, infos) {
          t.ifError(err)
          t.equal(infos.length, 1)
          var info = infos[0]
          var version = info.latestFirmwareVersion
          var blockType = Block.blockTypeForId(info.blockTypeId)
          t.ok(blockType !== BlockTypes.UNKNOWN)
          targetBlock._blockType = blockType
          t.ok(blockType !== MCUTypes.UNKNOWN)
          targetBlock._mcuType = Block.mcuTypeForId(info.mcuTypeId)

          firmwareService.downloadVersion(targetBlock, version, function (err, hex) {
            t.ifError(err)
            testHex = hex
            t.ok(hex)
          }) 
        })
      })

      test('flash os3 application to target', function (t) {
        t.plan(2)
        var blockId = targetBlock.getBlockId()
        var faceIndex = targetBlock.getFaceIndex()

        var program = new ClassicProgram(hexString)
        t.ok(program.valid, 'firmware valid')

        //XXX(donald): hack to not send reset command
        targetBlock._applicationVersion = new Version(0, 0, 0);

        var flash = new ClassicFlash(client)
        flash.programToBlock(program, targetBlock, function (err) {
          t.ifError(err, 'flashed block')
        })
        flash.on('progress', function (e) {
          console.log('progress', '(' + e.progress + '/' + e.total + ')')
        })
        flash.on('success', function (e) {
          t.pass("successfully flashed target.")
        })
        flash.on('error', function (e) {
          t.end(err)
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
