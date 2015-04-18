var events = require('events')

function Scanner (config) {
  events.EventEmitter.call(this)

  var sr = this

  this._devices = []

  this._filter = function (devices) {
    return devices
  }

  this._add = function (device) {
    sr._devices.push(device)
    sr.emit('add', device)
  }

  this._remove = function (device) {
    var i = sr._devices.indexOf(device)
    if (i > -1) sr._devices.splice(i, 1)
    sr.emit('remove', device)
  }

  this.startScan = function () {
    // (optional override)
  }

  this.listRobotDevices = function (callback) {
    if (callback) {
      callback(sr._devices)
    }
  }

  this.stopScan = function () {
    // (optional override)
  }
}

module.exports = Scanner
