var test = require('tape')
var util = require('util')
var cubelets = require('../index')
var Client = require('../client/index')
var Cubelet = require('../cubelet')
var Version = require('../version')
var config = require('./config')
var __ = require('underscore')

var cn = new Client().connect(config.device, function (err, construction) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('memory table', function (t) {
        t.plan(3)
        cn.sendRequest(new cubelets.GetMemoryTableRequest(), function (err, response) {
          t.ifError(err, 'no response err')
          t.ok(response, 'response ok')
          t.ok(response.slots, 'slots ok')
          console.log(response.slots)
        })
      })

      test('upload to memory slot', function (t) {
        t.plan(15)
        var slotData = new Buffer([
          0x00, 0x00,
          0xd3, 0x4d, 0xb3, 0x3f, 0xc0, 0xff, 0xee, 0xff,
          0xd3, 0x4d, 0xb3, 0x3f, 0xc0, 0xff, 0xee, 0xff
        ])
        var lineLength = 18
        var slotIndex = 9
        var slotSize = Math.ceil(slotData.length / lineLength)
        var blockType = Cubelet.Types.PASSIVE.id
        var version = new Version(1, 9, 2)
        var isCustom = false
        var crc = 0xcc
        var request = new cubelets.UploadToMemoryRequest(slotIndex, slotSize, blockType, version, isCustom, crc)
        // send an upload request
        cn.sendRequest(request, function (err, response) {
          t.ifError(err, 'no response err')
          t.ok(response, 'response ok')
          t.equal(response.result, 0, 'result success')
        })
        // wait for an upload complete event
        cn.on('event', function listener (e) {
          if (e instanceof cubelets.UploadToMemoryCompleteEvent) {
            cn.removeListener('event', listener)
            t.ok(e, 'event ok')
            t.equal(e.result, 0, 'result success')
            testMemoryTable()
          }
        })
        // send the data
        cn.sendData(slotData, function (err) {
          t.ifError(err, 'no data err')
        })
        // then test the table again once upload is complete
        function testMemoryTable() {
          cn.sendRequest(new cubelets.GetMemoryTableRequest(), function (err, response) {
            t.ifError(err, 'no response err')
            t.ok(response, 'response ok')
            var slots = response.slots
            t.ok(slots[slotIndex], 'slot exists')
            var slot = slots[slotIndex]
            t.equal(slot.slotSize, slotSize)
            t.equal(slot.blockType, blockType)
            t.equal(slot.version.major, version.major)
            t.equal(slot.version.minor, version.minor)
            t.equal(slot.version.patch, version.patch)
            t.equal(slot.isCustom, isCustom)
          })
        }
      })

      test('read a slot', function (t) {
        t.plan(1)
        var slotSize = 18
        var slotIndex = 9
        var stream = cn.stream()
        stream.write(new Buffer([
          '<'.charCodeAt(0),
          0x18,
          0x01,
          '>'.charCodeAt(0),
          slotIndex ]))
        stream.on('data', function (data) {
          console.log(data)
          n += data.length
          if (n >= slotSize) {
            t.pass('done')
          }
        })
      })

      // test('read full memory', function (t) {
      //   t.plan(1)
      //   var stream = cn.stream()
      //   var n = 0
      //   stream.write(new Buffer([
      //     '<'.charCodeAt(0),
      //     0x12,
      //     0x00,
      //     '>'.charCodeAt(0)
      //   ]))
      //   var fs = require('fs')
      //   stream.on('data', function (data) {
      //     fs.appendFileSync('/Users/Donald/Desktop/memory.log', data)
      //     n += data.length
      //     if (n >= 0x14000) {
      //       t.pass('done')
      //     }
      //   })
      // })

      // test('target block exists', function (t) {
      //   t.plan(2)
      //   cn.sendRequest(new cubelets.GetAllBlocksRequest(), function (err, response) {
      //     t.ifError(err, 'no response err')
      //     t.ok(response, 'response ok')
      //     var passive = __(response.blocks).find(function (block) {
      //       return block.id === config.construction.type.passive
      //     })
      //     t.ok(passive, 'has a passive')
      //   })
      // })

      test('disconnect', function (t) {
        t.plan(1)
        cn.disconnect(t.ifError)
      })
    }
  })
})
