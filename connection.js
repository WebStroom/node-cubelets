var util = require('util')
var events = require('events')
var Parser = require('./parser')
var Protocol = require('./protocol/imago')

var Connection = function (config) {
  events.EventEmitter.call(this)

  var cn = this

  this.connect = function (callback) {
    throw new Error('Not implemented.')
  }

  this._connect = function () {
    cn._parser = new Parser()
    cn._parser.on('message', function (msg) {
      if (Protocol.isEvent(msg)) {
        cn.emit('event', msg)
      } else if (Protocol.isResponse(msg)) {
        cn.emit('response', msg)
      }
    })
    process.nextTick(function () {
      cn.emit('connect')
    })
  }

  this.disconnect = function (callback) {
    throw new Error('Not implemented.')
  }

  this._disconnect = function () {
    if (this._parser) {
      cn._parser.removeAllListeners('message')
      cn._parser = null
    }
    process.nextTick(function () {
      cn.emit('disconnect')
    })
  }

  this.connected = function () {
    throw new Error('Not implemented.')
  }

  this.stream = function () {
    throw new Error('Not implemented.')
  }

  this.sendData = function (data, callback) {
    cn.stream.write(data, callback)
  }

  this.sendMessage = function (message, callback) {
    cn.sendData(message.encode(), callback)
  }

  this.sendCommand = this.sendMessage

  this.sendRequest = function (request, callback, timeout) {
    if (typeof callback !== 'function') {
      cn.sendMessage(request)
      return
    }

    timeout = timeout || 5000

    var timer = setTimeout(function () {
      cn.removeListener('response', waitForResponse)
      if (callback) {
        callback(new Error('Timed out waiting for response to request: ' + request.code()))
      }
    }, timeout)

    function waitForResponse(response) {
      if (Protocol.requestCodeForResponseCode(response.code()) === request.code()) {
        clearTimeout(timer)
        cn.removeListener('response', waitForResponse)
        if (callback) {
          callback(null, response)
        }
      }
    }

    cn.on('response', waitForResponse)
    cn.sendMessage(request)
  }

  return cn
}

util.inherits(Connection, events.EventEmitter)
module.exports = Connection
