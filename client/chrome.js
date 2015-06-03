var util = require('util')
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

  this._getDevices = function (callback) {
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

  this._compareDevice = function (device, otherDevice) {
    return device.address == otherDevice.address
  }
}

util.inherits(ChromeScanner, Scanner)

var ChromeConnection = function (device, opts) {
  Connection.call(this, device, opts)
  
  var address = device['address'] || '00:00:00:00:00:00'
  var uuid = device['uuid']

  var stream = this
  var input, socketStream, output
  var isOpen = false

  this._read = function (n) {
    // do nothing
  }

  this._write = function (chunk, enc, next) {
    if (socketStream) {
      input.write(chunk, next)
    }
  }

  this._open = function (callback) {
    callback = callback || Function()
    if (socketStream) {
      callback(null)
    } else {
      bluetoothClient.socket.connect(address, uuid, function (connectInfo) {
        var port = chrome.runtime.connect(appId, { name: connectInfo.port })
        socketStream = new ChromeRuntimeStream(port)
        input = BufferArrayStream.fromBuffer()
        output = BufferArrayStream.toBuffer()
        input.pipe(socketStream).pipe(output)

        isOpen = true

        output.on('data', function (chunk) {
          stream.push(chunk)
        })

        socketStream.once('end', function () {
          isOpen = false
          stream.close()
        })

        callback(null)
      })
    }
  }

  this._close = function (callback) {
    callback = callback || Function()
    if (!socketStream) {
      callback(null)
    } else {
      var ss = socketStream
      socketStream = null
      output.removeAllListeners('data')
      ss.removeAllListeners('close')
      if (isOpen) {
        ss.once('end', cleanup)
        ss.end(cleanup)
      } else {
        cleanup()
      }
      function cleanup() {
        isOpen = false
        input = ss = output = null
        callback(null)
      }
    }
  }
}

util.inherits(ChromeConnection, Connection)

module.exports = Client(new ChromeScanner(), ChromeConnection)

startRuntime()
