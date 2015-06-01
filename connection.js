var util = require('util')
var Duplex = require('readable-stream').Duplex

var Connection = function (device, opts) {
  Duplex.call(this, opts)

  var self = this
  var isOpen = false

  this.isOpen = function () {
    return isOpen
  }

  this.open = function (callback) {
    callback = callback || Function()
    if (isOpen) {
      callback(null)
    } else {
      self._open(function (err) {
        if (err) {
          callback(err)
          self.emit('error', err)
        } else {
          isOpen = true
          callback(null)
          self.emit('open')
        }
      })
    }
  }

  this._open = function (callback) {
    throw new Error('not implemented')
  }

  this.close = function (callback) {
    callback = callback || Function()
    if (!isOpen) {
      callback(null)
    } else {
      isOpen = false
      self._close(function (err) {
        if (err) {
          callback(err)
          self.emit('error', err)
        } else {
          callback(null)
          self.emit('close')
        }
      })
    }
  }

  this._close = function (callback) {
    throw new Error('not implemented')
  }

  this.getDevice = function () {
    return device
  }
}

util.inherits(Connection, Duplex)

module.exports = Connection
