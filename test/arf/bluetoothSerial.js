var test = require('tape')
var util = require('util')
var fs = require('fs')
var config = {
  "device": {
    "address": "00:04:3e:08:21:db",
    "channelID": 1
  }
}
var BluetoothSerialPort = require('bluetooth-serial-port').BluetoothSerialPort

var serialPort = new BluetoothSerialPort()
var inputPath = './test/arf/input.bin'
var logPath = './test/arf/log.bin'
var outputPath = './test/arf/output.bin'

test('amped rf flow', function (t) {
  t.plan(2)
  fs.existsSync(logPath) && fs.unlinkSync(logPath)
  var arr = []
  for (var i = 0; i < 256 * 100; ++i) {
    arr[i] = i % 256
  }
  var buf = new Buffer(arr)
  var bufCopy = new Buffer(0)
  fs.writeFileSync(inputPath, buf)
  serialPort.on('failure', function () {
    t.fail('unknown failure')
    t.end()
  })
  serialPort.on('data', function (data) {
    if (data.length === 0) {
      return
    }
    fs.appendFileSync(logPath, data)
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
      fs.writeFileSync(outputPath, bufCopy)
    }
  })
  serialPort.connect(config.device.address, config.device.channelID, function (err) {
    if (err) {
      t.fail('connect err')
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
  serialPort.once('closed', function (err) {
    t.ifError(err, 'no disconnect err')
  })
  serialPort.close()
})
