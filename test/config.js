var Decoder = require('../decoder')

var id = function (b2, b1, b0) {
  return Decoder.decodeID(new Buffer([b2, b1, b0]))
}

module.exports = process.browser ? {
  "device": {
    "address": "00:04:3e:08:21:a9"
  },
  "construction": (function () {
    var type = {
      bluetooth: id(22, 21, 20),
      passive: id(3, 2, 1),
      knob: id(6, 5, 4),
      distance: id(7, 5, 4),
      drive: id(9, 8, 7),
      flashlight: id(12, 11, 10),
      bargraph: id(13, 14, 14)
    }
  })() {
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
} : {
  "device": {
    "path": "/dev/tty.Cubelet-BWG-AMP-SPP"
  }
}
