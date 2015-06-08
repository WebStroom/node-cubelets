var util = require('util')
var net = require('net')
var Scanner = require('../scanner')
var Connection = require('../connection')
var Client = require('../client')
var xtend = require('xtend')

var NetScanner = function () {
  Scanner.call(this)

  this._getDevices = function (callback) {
    callback([])
  }
}

util.inherits(NetScanner, Scanner)

var NetConnection = function (device, opts) {
  opts = xtend(device, opts)
  Connection.call(this, device, opts)
  
  var stream = this
  var socket = null
  var isOpen = false

  this._read = function (n) {
    // do nothing
  }

  this._write = function (chunk, enc, next) {
    if (socket) {
      socket.write(chunk, next)
    }
  }

  this._open = function (callback) {
    callback = callback || Function()
    if (socket) {
      callback(null)
    } else {
      socket = net.connect(opts, function () {
        isOpen = true

        socket.on('error', function (err) {
          stream.emit('error', err)
        })

        socket.on('data', function (chunk) {
          stream.push(chunk)
        })

        socket.on('end', function () {
          isOpen = false
          stream.close()
        })

        callback(null)
      })
    }
  }

  this._close = function (callback) {
    callback = callback || Function()
    if (!socket) {
      callback(null)
    } else {
      var so = socket
      socket = null
      so.removeAllListeners('error')
      so.removeAllListeners('data')
      so.removeAllListeners('end')
      if (isOpen) {
        so.end()
        so.destroy()
      }
      isOpen = false
      so = null
      callback(null)
    }
  }
}

util.inherits(NetConnection, Connection)

module.exports = Client(new NetScanner(), NetConnection)
