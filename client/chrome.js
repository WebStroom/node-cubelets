var util = require('util')
var assert = require('assert')
var ChromeBluetoothClient = require('chrome-bluetooth-client')
var ChromeRuntimeStream = require('chrome-runtime-stream')
var BufferArrayStream = require('buffer-array-stream')
var Scanner = require('../scanner')
var Connection = require('../connection')
var Client = require('../client')

var appId = 'fehdhddkknkaeimadppmacaoclnllcjm'
var running = false
var bluetoothClient = null

function startRuntime() {
  if (!running) {
    var port = chrome.runtime.connect(appId, {name: 'control'})
    var runtimeStream = new ChromeRuntimeStream(port)
    bluetoothClient = new ChromeBluetoothClient()
    bluetoothClient.pipe(runtimeStream).pipe(bluetoothClient)
    bluetoothClient.once('end', restartRuntime)
    running = true
  }
}

function stopRuntime() {
  if (running) {
    bluetoothClient.end()
    bluetoothClient = null
    running = false
  }
}

function restartRuntime() {
  stopRuntime()
  startRuntime()
}

var ChromeScanner = function () {
  Scanner.call(this)

  this.getDevices = function (callback) {
    assert(typeof callback === 'function')
    bluetoothClient.getDevices(function (allDevices) {
      var devices = []
      allDevices.forEach(function (device) {
        var name = device.name
        if (name.indexOf('Cubelet') === 0) {
          devices.push(device)
        }
      })
      callback(devices)
    })
  }
}

util.inherits(ChromeScanner, Scanner)

var ChromeConnection = function (device) {
  Connection.call(this)
  
  var cn = this
  var address = device['address'] || '00:00:00:00:00:00'
  var uuid = device['uuid']
  var input, socketStream, output
  var connected = false

  this.connect = function (callback) {
    if (connected) {
      if (callback) {
        callback(null)
      }
      return
    }

    bluetoothClient.socket.connect(address, uuid, function (connectInfo) {
      var port = chrome.runtime.connect(appId, {name: connectInfo.port})
      socketStream = new ChromeRuntimeStream(port)
      input = BufferArrayStream.fromBuffer()
      output = BufferArrayStream.toBuffer()
      input.pipe(socketStream).pipe(output)

      output.on('data', function (data) {
        cn._parser.parse(data)
      })

      socketStream.on('end', function () {
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

    if (!socketStream) {
      if (callback) {
        callback(null)
      }
      return
    }

    var ss = socketStream
    socketStream = null
    output.removeAllListeners('data')
    ss.removeAllListeners('close')
    ss.end(function () {
      cn._disconnect()
      ss = null
      output = null
      input = null
      if (callback) {
        callback(null)
      }
    })
  }

  this.connected = function () {
    return connected
  }

  this.sendData = function (data, callback) {
    if (connected) {
      input.write(data, callback)
    } else {
      if (callback) {
        callback(new Error('not connected.'))
      }
    }
  }

  this.stream = function () {
    return socketStream
  }
}

util.inherits(ChromeConnection, Connection)

module.exports = Client(new ChromeScanner(), ChromeConnection)

startRuntime()
