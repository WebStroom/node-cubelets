var test = require('tape')
var fs = require('fs')
var async = require('async')
var config = require('../config')
var cubelets = require('../../index')
var Block = require('../../block')
var ImagoProtocol = require('../../protocol/imago')
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

      // Cache block types on face
      var blockTypes = {}

      // Put neighbors into application
      testNeighborsSetMode(1)

      // Store block types on faces to use later
      test('get neighbor block types on each face', function (t) {
        t.plan(2)
        client.sendRequest(new ImagoProtocol.messages.GetNeighborBlocksRequest(), function (err, response) {
          t.ifError(err)
          var tasks = __(response.neighbors).map(function (blockId, faceIndex) {
            faceIndex = parseInt(faceIndex, 10)
            return function (callback) {
              var request = new ImagoProtocol.Block.messages.GetConfigurationRequest(blockId)
              client.sendBlockRequest(request, function (err, response) {
                if (err) {
                  callback(err)
                } else {
                  blockTypes[faceIndex] = Block.blockTypeForId(response.blockTypeId)
                  console.log('face', faceIndex, 'is a', blockTypes[faceIndex].name)
                  callback(null)
                }
              })
            }
          })
          async.series(tasks, function (err) {
            t.ifError(err, 'got configuration for all blocks')
          })
        })
      })

      // Put neighbors into bootloader
      testNeighborsSetMode(0)

      test('find a neighbor and flash it', function (t) {
        t.plan(5)
        client.fetchNeighborBlocks(function (err, neighborBlocks) {
          t.ifError(err, 'fetched neighbors')
          t.ok(neighborBlocks.length > 0, 'found at least one neighbor')
          var targetBlock = neighborBlocks[0]
          var blockId = targetBlock.getBlockId()
          var faceIndex = targetBlock.getFaceIndex()
          var blockType = blockTypes[faceIndex]
          t.ok(blockType, 'block type is ' + blockType.name)
          var hex = fs.readFileSync('./upgrade/hex/application/' + blockType.name + '.hex')
          var program = new Program(hex)
          t.ok(program.valid, 'firmware valid')
          var flash = new Flash(client)
          flash.programToBlock(targetBlock, function (err) {
            t.ifError(err, 'flashed block')
          })
          flash.on('progress', function (e) {
            console.log('progress', '(' + e.progress + '/' + e.total + ')')
          })
        })
      })

      function testNeighborsSetMode(mode) {
        test(('put neighbors into ' + (mode ? 'application' : 'bootloader')), function (t) {
          t.plan(2)
          client.sendRequest(new ImagoProtocol.messages.GetNeighborBlocksRequest(), function (err, response) {
            t.ifError(err)
            var blockIds = __(response.neighbors).values()
            var tasks = __(blockIds).map(function (blockId) {
              console.log('found', blockId)
              return function (callback) {
                var request = new ImagoProtocol.Block.messages.SetModeRequest(blockId, mode)
                client.sendBlockRequest(request, function (err, response) {
                  if (err) {
                    callback(err)
                  } else if (response.mode !== mode) {
                    callback(new Error('Failed to jump to mode.'))
                  } else {
                    callback(null)
                  }
                })
              }
            })
            async.series(tasks, function (err) {
              t.ifError(err, 'all blocks jumped')
            })
          })
        })
      }

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
