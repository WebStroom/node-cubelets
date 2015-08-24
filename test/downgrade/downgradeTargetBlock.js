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
var Program = ImagoProtocol.Program
var Flash = ImagoProtocol.Flash
var __ = require('underscore')

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      var upgrade = new Upgrade(client)

      test('find os4 target block and flash bootloader', function (t) {
        t.plan(4)
        client.fetchNeighborBlocks(function (err, neighborBlocks) {
          t.ifError(err, 'req ok')
          t.ok(neighborBlocks.length > 0, 'found at least one neighbor')
          var targetBlock = neighborBlocks[0]
          targetBlock._mcuType = MCUTypes.PIC
          console.log(targetBlock.getMCUType())

          var blockId = targetBlock.getBlockId()
          var faceIndex = targetBlock.getFaceIndex()

          var hex = fs.readFileSync('./downgrade/pic_downgrader.hex')
          var program = new Program(hex)
          t.ok(program.valid, 'firmware valid')
          var flash = new Flash(client)
          flash.programToBlock(program, targetBlock, function (err) {
            t.ifError(err, 'flashed block')
          })
          flash.on('progress', function (e) {
            console.log('progress', '(' + e.progress + '/' + e.total + ')')
          })

        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
