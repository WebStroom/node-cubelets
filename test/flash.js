var test = require('tape')
var cubelets = require('../index')
var Client = require('../client/index')
var Cubelet = require('./cubelet')
var config = require('./config')
var __ = require('underscore')

var cn = new Client().connect(config.device, function (err, construction) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('target block exists', function (t) {
        t.plan(2)
        cn.sendRequest(new cubelets.GetAllBlocksRequest(), function (err, response) {
          t.ifError(err, 'no response err')
          t.ok(response, 'response ok')
          var passive = __(response.blocks).find(function (block) {
            return block.id === config.construction.type.passive
          })
          t.ok(passive, 'has a passive')
        })
      })

      test('memory table', function (t) {
        t.plan(2)
        cn.sendRequest(new cubelets.GetMemoryTableRequest(), function (err, response) {
          t.ifError(err, 'no response err')
          t.ok(response, 'response ok')
        })
      })

      test('upload to memory slot', function (t) {
        t.plan(14)
        var slotData = new Buffer([
          0xd3, 0x4d, 0xb3, 0x3f,
          0xc0, 0xff, 0xee, 0xff
        ])
        var lineLength = 18
        var slotIndex = 9
        var slotSize = Math.ceil(slotData.length / lineLength)
        var blockType = Cubelet.Types.id
        var version = new Version(1, 9, 2)
        var isCustom = false
        var crc = 0xcc
        var request = new cubelets.UploadToMemoryRequest(slotIndex, slotSize, blockType, version, isCustom, crc)
        cn.sendRequest(request, function (err, response) {
          t.ifError(err, 'no response err')
          t.ok(response, 'response ok')
          t.equal(response.result, 0)
        })
        cn.sendData(slotData, function (err) {
          t.ifError(err, 'no data err')
        })
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
          t.equal(slot.crc, crc)
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        cn.disconnect(t.ifError)
      })
    }
  })
})
