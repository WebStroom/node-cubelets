var util = require('util')
var assert = require('assert')
var BluetoothSerialPort = require('bluetooth-serial-port').BluetoothSerialPort
var Scanner = require('../scanner')
var Connection = require('../connection')
var Client = require('../client')

var BluetoothSerialScanner = function () {
  Scanner.call(this)

  this.listRobotDevices = function (callback) {
    assert(typeof callback === 'function')
    var serialPort = new BluetoothSerialPort()
    serialPort.listPairedDevices(function (pairedDevices) {
      var devices = []
      if (err) {
        callback(devices)
      } else {
        pairedDevices.forEach(function (pairedDevice) {
          var name = pairedDevice.name
          if (name.indexOf('Cubelet') === 0) {
            devices.push(pairedDevice)
          }
        })
        callback(devices)
      }
    })
  }

  return this
}

util.inherits(BluetoothSerialScanner, Scanner)

var BluetoothSerialConnection = function (device) {
  Connection.call(this)
  
  var address = device['address'] || '00:00:00:00:00:00'
  var services = device['services']
  var channelID = 0
  if (typeof device['channelID'] !== 'undefined') {
    channelID = device.channelID
  } else if (Array.isArray(services) && services.length > 0) {
    channelID = services[0].channelID
  }

  var cn = this
  var serialPort = null
  var stream = null
  var connected = false

  this.connect = function (callback) {
    if (connected) {
      if (callback) {
        callback(null)
      }
      return
    }

    serialPort = new BluetoothSerialPort()

    stream = through(function write (chunk, enc, next) {
      serialPort.write(chunk, next || Function())
    })

    serialPort.on('error', function (err) {
      cn.emit('error', err)
      stream.emit('error', err)
    })

    serialPort.connect(address, channelID, function (err) {
      if (err) {
        if (callback) {
          callback(err)
        }
        return
      }

      serialPort.on('data', function (data) {
        cn._parser.parse(data)
        stream.queue(data)
      })

      serialPort.once('closed', function () {
        cn.disconnect()
        stream.end()
      })

      serialPort.once('failure', function () {
        cn.disconnect()
        stream.end()
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
    var st = stream
    serialPort = null
    stream = null
    sp.removeAllListeners('data')
    sp.removeAllListeners('closed')
    sp.removeAllListeners('failure')
    function close() {
      sp.removeAllListeners('error')
      cn._disconnect()
      st.end()
      sp = null
      st = null
      if (callback) {
        if (err) {
          callback(err)
        } else {
          callback(null)
        }
      }
    }
    if (serialPort.isOpen()) {
      close()
    } else {
      sp.once('close', close)
      sp.close()
    }
  }

  this.connected = function () {
    return connected
  }

  this.sendData = function (data, callback) {
    if (connected) {
      serialPort.write(data, callback || Function())
    } else {
      if (callback) {
        callback(new Error('Client is not connected.'))
      }
    }
  }

  this.stream = function () {
    return stream
  }

  return this
}

util.inherits(BluetoothSerialConnection, Connection)

module.exports = Client(new BluetoothSerialScanner(), BluetoothSerialConnection)
