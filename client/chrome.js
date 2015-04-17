var util = require('util')
var assert = require('assert')
var Client = require('../client')

assert(chrome.runtime)
assert(chrome.runtime.connect)

var ChromeClient = function (bluetoothClient) {
  Client.call(this)
  
  var client = this
  var connected = false

  this.connect = function (callback) {
    if (connected) {
      if (callback) {
        callback(null)
      }
      return
    }

    var port = chrome.runtime.connect()

    serialPort = new SerialPort(path, {}, false)

    serialPort.on('error', function (err) {
      client.emit('error', err)
    })

    serialPort.open(function (err) {
      if (err) {
        if (callback) {
          callback(err)
        }
        return
      }

      serialPort.on('data', function (data) {
        client._parser.parse(data)
      })

      serialPort.on('close', function () {
        client.disconnect()
      })

      connected = true

      client._connect()

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
        client._disconnect()
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

  return serialPort
}

util.inherits(SerialClient, Client)
module.exports = SerialClient
