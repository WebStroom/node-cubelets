var util = require('util')
var Message = require('../message')
var Decoder = require('../decoder')
var Version = require('../version')

var GetMemoryTableResponse = function (slots) {
  Message.call(this)
  this.slots = slots
}

util.inherits(GetMemoryTableResponse, Message)

GetMemoryTableResponse.prototype.decode = function (data) {
  if (data.length < 4) {
    console.error('Size should be at least 4 bytes.')
    return false
  }

  var mask = data.readUInt32BE(0)
  var slotsLength = data.length - 4

  if (slotsLength % 7 != 0) {
    console.error('Slots size should be divisible by 7.')
    return false
  }

  console.log('data', data)

  var slots = {}
  var count = slotsLength / 7
  var p = 4
  for (var i = 0; i < 32; ++i) {
    if (mask & (1 << i)) {
      /* format: [ t, sz1, sz0, v2, v1, v0, c ] */
      slots[i] = {
        blockType: data.readUInt8(p + 0),
        slotSize: data.readUInt16BE(p + 1),
        version: Decoder.decodeVersion(data.slice(p + 3, p + 6)),
        isCustom: data.readUInt8(p + 6) ? true : false
      }
      p += 7
    }
  }

  this.slots = slots
  return true
}

module.exports = GetMemoryTableResponse
