var util = require('util')
var assert = require('assert')
var Client = require('../client')
var ChromeBluetoothClient = require('chrome-bluetooth-client')
var ChromeRuntimeStream = require('chrome-runtime-stream')
var BufferArrayStream = require('buffer-array-stream')

var appId = 'fehdhddkknkaeimadppmacaoclnllcjm'
var running = false
var bluetoothClient = null

function start() {
  if (!running) {
    var port = chrome.runtime.connect(appId, {name: 'control'})
    var runtimeStream = new ChromeRuntimeStream(port)
    bluetoothClient = new ChromeBluetoothClient()
    bluetoothClient.pipe(runtimeStream).pipe(bluetoothClient)
    bluetoothClient.on('end', restart)
    running = true
  }
}

function stop() {
  if (running) {
    bluetoothClient.end()
    bluetoothClient.removeListener('end', restart)
    bluetoothClient = null
    running = false
  }
}

function restart() {
  stop()
  start()
}

var ChromeClient = function (config) {
  Client.call(this)
  
  var client = this
  var address = config['address']
  var uuid = config['uuid']
  var socketStream = null
  var connected = false

  this.connect = function (callback) {
    if (connected) {
      if (callback) {
        callback(null)
      }
      return
    }

    bluetoothClient.on('error', function (err) {
      client.emit('error', err)
    })

    bluetoothClient.socket.connect(address, uuid, function (connectInfo) {
      var port = chrome.runtime.connect(appId, {name: connectInfo.port})
      socketStream = new ChromeRuntimeStream(port)
      var fromBufferStream = BufferArrayStream.fromBuffer()
      var toBufferStream = BufferArrayStream.toBuffer()
      fromBufferStream.pipe(socketStream).pipe(toBufferStream)

      socketStream.on('data', function (data) {
        client._parser.parse(data)
      })

      socketStream.on('end', function () {
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

    if (!socketStream) {
      if (callback) {
        callback(null)
      }
      return
    }

    var ss = socketStream
    socketStream = null
    ss.removeAllListeners('data')
    ss.removeAllListeners('close')
    ss.end(function () {
      sp.removeAllListeners('error')
      client._disconnect()
      ss = null
      if (callback) {
        if (err) {
          callback(err)
        } else {
          callback(null)
        }
      }
    })
  }

  this.connected = function () {
    return connected
  }

  this.sendData = function (data, callback) {
    if (connected) {
      socketStream.write(data, callback)
    } else {
      if (callback) {
        callback(new Error('Client is not connected.'))
      }
    }
  }

  this.stream = function () {
    return socketStream
  }

  return this
}

util.inherits(ChromeClient, Client)
module.exports = ChromeClient
start()
