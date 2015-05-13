var test = require('tape')
var util = require('util')
var fs = require('fs')
var config = require('../config')
var SerialPort = require('serialport').SerialPort

var serialPort = new SerialPort(config.device.path, {}, false)
var inputPath = './test/arf/input.bin'
var appendPath = './test/arf/append.bin'
var writePath = './test/arf/write.bin'

test('amped rf flow', function (t) {
  t.plan(2)
  fs.exists(appendPath) && fs.unlink(appendPath)
  var arr = []
  for (var i = 0; i < 256 * 100; ++i) {
    arr[i] = i % 256
  }
  var buf = new Buffer(arr)
  var bufCopy = new Buffer(0)
  fs.writeFileSync(inputPath, buf)
  serialPort.on('error', function (err) {
    t.end(err)
  })
  serialPort.on('data', function (data) {
    fs.appendFileSync(appendPath, data)
    bufCopy = Buffer.concat([ bufCopy, data ])
    if (bufCopy.length > buf.length) {
      t.fail('received too many bytes')
      t.end()
    } else if (bufCopy.length === buf.length) {
      t.pass('received all bytes')
      var matchBufs = true
      for (var i = 0; i < buf.length; ++i) {
        if (bufCopy[i] !== buf[i]) {
          matchBufs = false
          break
        }
      }
      t.ok(matchBufs, 'mismatched buffers')
      fs.writeFileSync(writePath, bufCopy)
    }
  })
  serialPort.open(function (err) {
    if (err) {
      t.end(err)
    } else {
      setTimeout(function () {
        serialPort.write(buf, function (err) {
          if (err) {
            t.fail('write err')
            t.end(err)
          }
        })
      }, 5000)
    }
  })
})

test('disconnect', function (t) {
  t.plan(1)
  serialPort.close(function (err) {
    t.ifError(err, 'no disconnect err')
  })
})
