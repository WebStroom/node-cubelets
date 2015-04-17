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
  var fromBufferStream = null
  var toBufferStream = null
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
      fromBufferStream = BufferArrayStream.fromBuffer()
      toBufferStream = BufferArrayStream.toBuffer()
      fromBufferStream.pipe(socketStream).pipe(toBufferStream)

      toBufferStream.on('data', function (data) {
        client._parser.parse(data)
      })

      socketStream.on('end', function () {
        client.disconnect()
      })

      connected = true

      client._connect()
      console.log('connected')

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
    toBufferStream.removeAllListeners('data')
    ss.removeAllListeners('close')
    ss.end(function () {
      client._disconnect()
      ss = null
      toBufferStream = null
      fromBufferStream = null
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
      fromBufferStream.write(data, callback)
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
