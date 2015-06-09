var util = require('util')
var events = require('events')
var xtend = require('xtend/mutable')

var Protocols = {
  Imago: require('./protocol/imago'),
  Classic: require('./protocol/classic')
}

function Factory(Scanner, Connection) {

  function Client (con) {
    events.EventEmitter.call(this)

    var client = this
    
    client._defaultTimeout = 5000

    this.getConnection = function () {
      return con
    }

    this.disconnect = function (callback) {
      con.close(callback)
    }

    con.on('close', function listener(err) {
      client.emit('disconnect', err)
    })

    var protocol, parser, strategy

    this.setProtocol = function (newProtocol) {
      if (newProtocol !== protocol) {
        protocol = newProtocol
        setParser(new protocol.Parser())
        setStrategy(new protocol.Strategy(client))
      }
    }

    this.getProtocol = function () {
      return protocol
    }

    function setParser(newParser) {
      if (parser) {
        con.removeListener('data', parser.parse)
        parser.removeAllListeners('message')
      }
      parser = newParser
      parser.on('message', function (message) {
        if (protocol.isEvent(message)) {
          client.emit('event', message)
        }
        if (protocol.isResponse(message)) {
          client.emit('response', message)
        }
      })
      con.on('data', parser.parse)
    }

    this.getParser = function () {
      return parser
    }

    function setStrategy(newStrategy) {
      strategy = newStrategy
      xtend(client, strategy)
    }

    this.setDefaultTimeout = function(t) {
      client._defaultTimeout = t
    }

    this.getDefaultTimeout = function () {
      return client._defaultTimeout
    }

    this.sendData = function (data, callback) {
      con.write(data, callback)
    }

    client._isAlive = null

    this.isAlive = function () {
      return client._isAlive
    }

    var keepAliveTimer = null

    this.startKeepAliveTimer = function (interval, timeout) {
      client.stopKeepAliveTimer()
      timeout = timeout || client._defaultTimeout
      interval = interval || (2 * timeout)
      keepAliveTimer = setInterval(function () {
        client.ping(function (err) {
          if (err) {
            client.stopKeepAliveTimer()
            client.emit('error', new Error('Keep alive timer expired.'))
          }
        }, timeout)
      }, interval)
    }

    this.stopKeepAliveTimer = function () {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer)
        keepAliveTimer = null
      }
    }

    this.setProtocol(Protocols.Imago)
    return this
  }

  util.inherits(Client, events.EventEmitter)

  xtend(Client, Scanner)
  Client.Protocol = Protocols.Imago
  xtend(Client.Protocol, Protocols)

  Client.connect = function (device, callback) {
    callback = callback || Function()
    var con = new Connection(device)
    var client = new Client(con)
    con.open(function (err) {
      if (err) {
        callback(err)
      } else {
        callback(null, con)
        client.emit('connect', con)
      }
    })

    return client
  }

  return Client

}

module.exports = Factory
