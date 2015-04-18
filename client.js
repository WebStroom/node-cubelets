var util = require('util')
var events = require('events')

module.exports = function  (Scanner, Connection) {

  function Client () {
    events.EventEmitter.call(this)

    this.connect = function (device, callback) {
      var cn = new Connection(device)
      var self = this
      cn.connect(function (err) {
        if (err) {
          self.emit('error', err)
          if (callback) {
            callback(err)
          }
        } else {
          self.emit('connection', cn)
          if (callback) {
            callback(null, cn)
          }
        }
      })
      return cn
    }

    return this
  }

  util.inherits(Client, events.EventEmitter)

  Client.Scanner = Scanner
  Client.Connection = Connection

  return Client

}
