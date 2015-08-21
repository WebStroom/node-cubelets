var test = require('tape')
var util = require('util')
var fs = require('fs')
var __ = require('underscore')

var config = require('./config')
var cubelets = require('../index')
var Protocol = cubelets.Protocol
var Block = cubelets.Block
var BlockTypes = cubelets.BlockTypes
var Version = cubelets.Version
var Program = Protocol.Program

var blockId = 172175
var blockType = BlockTypes.BLOCKER

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('target block ' + blockId + ' exists', function (t) {
        t.plan(3)
        client.sendRequest(new Protocol.messages.GetAllBlocksRequest(), function (err, response) {
          t.ifError(err, 'no blocks response err')
          t.ok(response, 'blocks response ok')
          console.log('blocks', response.blocks)
          var target = __(response.blocks).find(function (block) {
            return block.blockId === blockId
          })
          t.ok(target, 'found target')
        })
      })

      test('can flash a ' + blockType.name + ' hex', function (t) {
        t.plan(9)

        // check the program is valid
        var hex = fs.readFileSync('./upgrade/hex/applications/' + blockType.name + '.hex')
        var program = new Program(hex)
        t.ok(program.valid, 'program valid')

        var lineLength = 18
        var slotIndex = 2
        var slotData = program.data
        var slotSize = Math.ceil(slotData.length / lineLength)
        var blockTypeId = blockType.typeId
        var version = new Version(4, 5, 6)
        var isCustom = false
        var crc = 0xcc

        // send an upload request
        var request = new Protocol.messages.UploadToMemoryRequest(slotIndex, slotSize, blockTypeId, version, isCustom, crc)
        client.sendRequest(request, function (err, response) {
          t.ifError(err, 'no upload response err')
          t.ok(response, 'upload response ok')
          t.equal(response.result, 0, 'upload result success')
          // send the data
          client.sendData(program.data, function (err) {
            console.log('send data callback', err)
          })
        })
        // wait for an upload complete event
        client.on('event', function listener (e) {
          if (e instanceof Protocol.messages.UploadToMemoryCompleteEvent) {
            client.removeListener('event', listener)
            t.ok(e, 'event ok')
            t.equal(e.result, 0, 'event result success')
            testFlash()
          }
        })
        // then test flashing
        function testFlash() {
          var request = new Protocol.messages.FlashMemoryToBlockRequest(blockId, slotIndex)
          client.sendRequest(request, function (err, response) {
            t.ifError(err, 'no flash response err')
            t.ok(response, 'flash response ok')
            t.equal(response.result, 0, 'flash result success')
          }, 1000 * 30)
        }
      })
      
      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })

    }
  })
})
