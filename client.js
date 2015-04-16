var util = require('util')
var events = require('events')
var Parser = require('./parser')
var Protocol = require('./index').Protocol

var Client = function (config) {
  events.EventEmitter.call(this)

  var client = this

  this.connect = function (callback) {
    throw new Error('Not implemented.')
  }

  this._connect = function () {
    this._parser = new Parser()
    this._parser.on('message', function (msg) {
      if (Protocol.isEvent(msg)) {
        client.emit('event', msg)
      } else if (Protocol.isResponse(msg)) {
        client.emit('response', msg)
      }
    })
    process.nextTick(function () {
      client.emit('connect')
    })
  }

  this.disconnect = function (callback) {
    throw new Error('Not implemented.')
  }

  this._disconnect = function () {
    if (this._parser) {
      this._parser.removeAllListeners('message')
      this._parser = null
    }
    process.nextTick(function () {
      client.emit('disconnect')
    })
  }

  this.connected = function () {
    throw new Error('Not implemented.')
  }

  this.stream = function () {
    throw new Error('Not implemented.')
  }

  this.sendData = function (data, callback) {
    this.stream.write(data, callback)
  }

  this.sendCommand = function (command, callback) {
    this.sendData(command.encode(), callback)
  }

  this.sendRequest = function (request, callback, timeout) {
    if (typeof callback !== 'function') {
      this.sendData(request.encode())
      return
    }

    timeout = timeout || 5000

    var timer = setTimeout(function () {
      client.removeListener('response', waitForResponse)
      if (callback) {
        callback(new Error('Timed out waiting for response to request: ' + request.code()))
      }
    }, timeout)

    function waitForResponse(response) {
      if (Protocol.requestCodeForResponseCode(response.code()) === request.code()) {
        clearTimeout(timer)
        client.removeListener('response', waitForResponse)
        if (callback) {
          callback(null, response)
        }
      }
    }

    client.on('response', waitForResponse)
    client.sendData(request.encode())
  }

  return client
}

util.inherits(Client, events.EventEmitter)
module.exports = Client
