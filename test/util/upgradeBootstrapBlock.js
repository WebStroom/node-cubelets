var test = require('tape')
var fs = require('fs')
var config = require('../config')
var cubelets = require('../../index')
var Block = require('../../block')
var MCUTypes = require('../../mcuTypes')
var BootstrapProtocol = require('../../protocol/bootstrap')
var Upgrade = require('../../upgrade')
var ImagoProtocol = require('../../protocol/imago')
var ImagoProgram = ImagoProtocol.Program
var ImagoFlash = ImagoProtocol.Flash
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

      var ignoreBatteryFaceIndex = 4
      var targetFaceIndex = -1

      test('discover an os4 target', function (t) {
        t.plan(1)
        client.on('event', waitForBlockEvent)
        var timer = setTimeout(function () {
          client.removeListener('event', waitForBlockEvent)
          t.fail('no block found events')
        }, 1000)
        function waitForBlockEvent(e) {
          if (e instanceof BootstrapProtocol.messages.BlockFoundEvent) {
            if (e.firmwareType === 1 && e.faceIndex !== ignoreBatteryFaceIndex) {
              targetFaceIndex = e.faceIndex
              clearTimeout(timer)
              client.removeListener('event', waitForBlockEvent)
              t.pass('found os4 target at face ' + targetFaceIndex)
            }
          }
        }
      })

      test('jump to os4', function (t) {
        t.plan(2)
        client.setProtocol(BootstrapProtocol)
        client.sendRequest(new BootstrapProtocol.messages.SetBootstrapModeRequest(1), function (err, response) {
          t.ifError(err)
          client.setProtocol(ImagoProtocol)
          setTimeout(function () {
            t.equal(response.mode, 1, 'jumped to os4')
          }, 2000)
        })
      })

      var targetBlock = null

      test('find os4 blocks', function (t) {
        t.plan(3)
        client.fetchNeighborBlocks(function (err, neighborBlocks) {
          t.ifError(err, 'req ok')
          targetBlock = __(neighborBlocks).find(function (block) {
            return block.getFaceIndex() === targetFaceIndex
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

      test('bootstrap os4 target', function (t) {
        t.plan(2)
        var blockType = targetBlock.getBlockType()
        var hex = fs.readFileSync('./upgrade/hex/applications/' + blockType.name + '.hex')
        var program = new ImagoProgram(hex)
        t.ok(program.valid, 'program is valid')
        var flash = new ImagoFlash(client, {
          skipSafeCheck: true
        })
        flash.programToBlock(program, targetBlock, function (err) {
          t.ifError(err)
        })
        flash.on('progress', function (e) {
          console.log(e.action, 'progress', Math.floor(100 * e.progress / e.total) + '%')
        })
      })

      test('os4 target is in application', function (t) {
        t.plan(2)
        var blockId = targetBlock.getBlockId()
        var request = new ImagoProtocol.Block.messages.GetConfigurationRequest(blockId)
        client.sendBlockRequest(request, function (err, response) {
          t.ifError(err, 'block req ok')
          t.equal(request.mode, 1, 'in application mode')
        })
      })

      test('jump to discovery', function (t) {
        t.plan(1)
        client.sendCommand(new ImagoProtocol.messages.ResetCommand())
        setTimeout(function () {
          client.setProtocol(BootstrapProtocol)
          t.pass('upgrade mode')
        }, 500)
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
