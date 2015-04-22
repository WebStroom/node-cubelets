module.exports = process.browser ? {
  "device": {
    "address": "00:04:3e:08:21:a9"
  }
} : {
  "device": {
    "path": "/dev/tty.Cubelet-CCC-AMP-SPP"
  }
}
