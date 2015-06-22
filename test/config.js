var Decoder = require('../protocol/decoder')

function id(b2, b1, b0) {
  return Decoder.decodeID(new Buffer([b2, b1, b0]))
}

function device() {
  return process.browser ? {
    "address": "00:04:3e:08:21:a9"
  } : {
    "path": "COM4",
    "address": "00:04:3e:08:21:db",
    "channelID": 1
  }
}

function construction() {
  var type = {
    bluetooth: id(22, 21, 20),
    passive: id(3, 2, 1),
    knob: id(6, 5, 4),
    distance: id(7, 5, 4),
    flashlight: id(12, 11, 10),
    bargraph: id(9, 8, 7),
    drive: id(9, 8, 7)
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
