var Decoder = require('../protocol/decoder')

function blockId(b2, b1, b0) {
  return Decoder.decodeId(new Buffer([b2, b1, b0]))
}

function device() {
  return process.browser ? {
    "address": "00:04:3e:08:21:a9"
  } : {
    "path": "/dev/cu.Cubelet-GPW-AMP-SPP",
    "address": "00:04:3e:08:21:db",
    "channelID": 1
  }
}

function construction() {
  var type = {
    bluetooth: blockId(22, 21, 20),
    passive: blockId(3, 2, 1),
    knob: blockId(6, 5, 4),
    distance: blockId(7, 5, 4),
    flashlight: blockId(12, 11, 10),
    bargraph: blockId(13, 14, 14),
    drive: blockId(9, 8, 7)
  }
  return {
    "type": type,
    "hopcount": [[
      type.bluetooth
    ],[
      type.passive,
      type.blocker
    ],[
      type.knob,
      type.bargraph
    ]]
  }
}

module.exports = {
  "device": device(),
  "construction": construction()
}
