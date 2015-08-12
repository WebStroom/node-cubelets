var util = require('util')
var net = require('net')
var Scanner = require('../scanner')
var Connection = require('../connection')
var Client = require('../client')
var xtend = require('xtend')

var host = 'localhost'
var port = 3000

if (process.browser) {
  net.setProxy({
    hostname: host,
    port: port
  })
}

var NetScanner = function () {
  Scanner.call(this)

  this._getDevices = function (callback) {
    callback([{
      name: 'Cubelet Network',
      deviceId: port,
      host: host,
      port: port
    }])
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
    if (socket) {
      if (callback) {
        callback(null)
      }
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

        if (callback) {
          callback(null)
        }
      })
    }
  }

  this._close = function (callback) {
    if (!socket) {
      if (callback) {
        callback(null)
      }
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
      if (callback) {
        callback(null)
      }
    }
  }
}

util.inherits(NetConnection, Connection)

module.exports = Client(new NetScanner(), NetConnection)
