var util = require('util')
var SerialPort = require('serialport').SerialPort
var Scanner = require('../scanner')
var Connection = require('../connection')
var Client = require('../client')

var SerialScanner = function () {
  Scanner.call(this)

  this._getDevices = function (callback) {
    var sp = require('serialport')
    sp.list(function (err, ports) {
      var devices = []
      if (err) {
        callback(devices)
      } else {
        ports.forEach(function (port) {
          var name = port.comName
          if (name.indexOf('Cubelet') === 0) {
            devices.push({
              path: name
            })
          }
        })
        callback(devices)
      }
    })
  }

  this._compareDevice = function (device, otherDevice) {
    return device.path == otherDevice.path
  }
}

util.inherits(SerialScanner, Scanner)

var SerialConnection = function (device, opts) {
  Connection.call(this, device, opts)
  
  var path = device['path'] || ((process.platform === 'win32') ?
    'COM1' : '/dev/cu.Cubelet-RGB-AMP-SPP')

  var stream = this
  var serialPort = null
  var isOpen = false

  this._read = function (n) {
    // do nothing
  }

  this._write = function (data, enc, next) {
    var chunkSize = 60

    function write(data, callback) {
      if (serialPort) {
        serialPort.write(data, callback)
      } else {
        callback(new Error('disconnected'))
      }
    }

    function writeChunk(i) {
      var start = i * chunkSize
      var end = start + chunkSize
      var chunk = data.slice(start, end)
      if (chunk.length > 0) {
        write(chunk, function (err) {
          if (err) {
            next(err)
          } else {
            writeChunk(i + 1)
          }
        })
      } else {
        next()
      }
    }

    writeChunk(0)
  }

  this._open = function (callback) {
    callback = callback || Function()
    if (serialPort) {
      callback(null)
    } else {
      serialPort = new SerialPort(path, {}, false)

      serialPort.on('error', function (err) {
        stream.emit('error', err)
      })

      serialPort.open(function (err) {
        if (err) {
          callback(err)
        } else {
          isOpen = true

          serialPort.on('data', function (chunk) {
            stream.push(chunk)
          })

          serialPort.on('close', function () {
            isOpen = false
            stream.close()
          })

          callback(null)
        }
      })
    }
  }

  this._close = function (callback) {
    callback = callback || Function()
    if (!serialPort) {
      callback(null)
    } else {
      var sp = serialPort
      serialPort = null
      sp.removeAllListeners('data')
      sp.removeAllListeners('close')
      sp.removeAllListeners('error')
      if (isOpen) {
        sp.close(cleanup)
      } else {
        cleanup()
      }
      function cleanup(err) {
        isOpen = false
        sp = null
        callback(err)
      }
    }
  }
}

util.inherits(SerialConnection, Connection)

module.exports = Client(new SerialScanner(), SerialConnection)
