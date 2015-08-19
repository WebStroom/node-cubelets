var test = require('tape')
var fs = require('fs')
var config = require('../config')
var cubelets = require('../../index')
var Upgrade = require('../../upgrade')
var Block = require('../../block')
var MCUTypes = require('../../mcuTypes')
var UpgradeProtocol = require('../../protocol/bootstrap/upgrade')
var ClassicProtocol = require('../../protocol/classic')
var ClassicProgram = require('../../protocol/classic/program')
var ClassicFirmware = require('../../protocol/classic/firmware')
var ImagoProtocol = require('../../protocol/imago')
var InfoService = require('../../services/info')
var __ = require('underscore')

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      var upgrade = new Upgrade(client)

      test('detect bootstrap', function (t) {
        t.plan(3)
        upgrade.detectIfNeeded(function (err, needsUpgrade, firmwareType) {
          t.ifError(err, 'no err')
          t.ok(needsUpgrade, 'needs upgrade')
          t.equal(firmwareType, 2, 'has bootstrap firmware')
        })
      })

      var batteryFaceIndex = 4
      var faceIndex = -1

      test('discover an os3 target', function (t) {
        t.plan(1)
        var timer = setTimeout(function () {
          client.removeListener('event', waitForBlockEvent)
          t.fail('no block found events')
        }, 1000)
        function waitForBlockEvent(e) {
          if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
            if (e.firmwareType === 0 && e.faceIndex !== batteryFaceIndex) {
              faceIndex = e.faceIndex
              clearTimeout(timer)
              client.removeListener('event', waitForBlockEvent)
              t.pass('found os3 target at face ' + faceIndex)
            }
          }
        }
        client.on('event', waitForBlockEvent)
      })

      test('jump to os3', function (t) {
        t.plan(2)
        client.setProtocol(UpgradeProtocol)
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(0), function (err, response) {
          t.ifError(err)
          client.setProtocol(ClassicProtocol)
          setTimeout(function () {
            t.equals(response.mode, 0, 'jumped to os3')
          }, 2000)
        })
      })

      var targetBlock = null

      test('find os3 blocks', function (t) {
        t.plan(3)
        client.fetchNeighborBlocks(function (err, neighborBlocks) {
          t.ifError(err, 'req ok')
          targetBlock = __(neighborBlocks).find(function (block) {
            return block._faceIndex === faceIndex
          })
          t.ok(targetBlock, 'found target block')
          t.pass('target block id is ' + targetBlock.getBlockId())
        })
      })

      test('look up block info', function (t) {
        t.plan(5)
        var info = new InfoService()
        info.fetchBlockInfo([targetBlock], function (err, infos) {
          t.ifError(err, 'fetch ok')
          t.equal(infos.length, 1, 'has info')
          var info = infos[0]
          targetBlock._blockType = Block.blockTypeForId(info.blockTypeId)
          targetBlock._mcuType = Block.mcuTypeForId(info.mcuTypeId)
          targetBlock._applicationVersion = info.currentFirmwareVersion
          t.ok(targetBlock.getBlockType() !== MCUTypes.UNKNOWN, 'target type is ' + targetBlock.getBlockType().name)
          t.ok(targetBlock.getMCUType() === MCUTypes.PIC, 'target is PIC')
          t.pass('target app version is ' + targetBlock.getApplicationVersion().toString())
        })
      })

      test('bootstrap os3 target', function (t) {
        t.plan(2)
        var hex = fs.readFileSync('./upgrade/hex/drive_bootstrap.hex')
        var program = new ClassicProgram(hex)
        t.ok(program.valid, 'program is valid')
        var firmware = new ClassicFirmware(program, client)
        firmware.flashToBlock(targetBlock, function (err) {
          t.ifError(err)
        })
        firmware.on('progress', function (e) {
          console.log('progress', Math.floor(100 * e.progress / e.total) + '%')
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
