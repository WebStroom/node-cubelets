var util = require('util')
var assert = require('assert')
var SerialPort = require('serialport').SerialPort
var Scanner = require('../scanner')
var Connection = require('../connection')
var Client = require('../client')

var SerialScanner = function () {
  Scanner.call(this)

  this.listRobotDevices = function (callback) {
    assert(typeof callback === 'function')
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

  return this
}

util.inherits(SerialScanner, Scanner)

var SerialConnection = function (device) {
  Connection.call(this)
  
  var path = device['path'] || ((process.platform === 'win32') ?
    'COM1' : '/dev/cu.Cubelet-RGB-AMP-SPP')

  var cn = this
  var serialPort = null
  var connected = false

  this.connect = function (callback) {
    if (connected) {
      if (callback) {
        callback(null)
      }
      return
    }

    serialPort = new SerialPort(path, {}, false)

    serialPort.on('error', function (err) {
      cn.emit('error', err)
    })

    serialPort.open(function (err) {
      if (err) {
        if (callback) {
          callback(err)
        }
        return
      }

      serialPort.on('data', function (data) {
        cn._parser.parse(data)
      })

      serialPort.on('close', function () {
        cn.disconnect()
      })

      connected = true

      cn._connect()

      if (callback) {
        callback(null)
      }
    })
  }

  this.disconnect = function (callback) {
    if (!connected) {
      if (callback) {
        callback(null)
      }
      return
    }

    connected = false

    if (!serialPort) {
      if (callback) {
        callback(null)
      }
      return
    }

    var sp = serialPort
    serialPort = null
    sp.drain(function (err) {
      sp.removeAllListeners('data')
      sp.removeAllListeners('close')
      sp.close(function (err) {
        sp.removeAllListeners('error')
        cn._disconnect()
        sp = null
        if (callback) {
          if (err) {
            callback(err)
          } else {
            callback(null)
          }
        }
      })
    })
  }

  this.connected = function () {
    return connected
  }

  this.sendData = function (data, callback) {
    if (connected) {
      serialPort.write(data, callback)
    } else {
      if (callback) {
        callback(new Error('Client is not connected.'))
      }
    }
  }

  this.stream = function () {
    return serialPort
  }

  return this
}

util.inherits(SerialConnection, Connection)

module.exports = Client(new SerialScanner(), SerialConnection)
