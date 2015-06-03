var test = require('tape')
var config = require('./config')
var cubelets = require('../index')
var Protocol = cubelets.Protocol
var __ = require('underscore')

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('commands', function (t) {
        t.plan(3)
        client.sendCommand(new Protocol.messages.SetBlockValueCommand(0, 0), t.ifError)
        client.sendCommand(new Protocol.messages.SetLEDColorCommand(0), t.ifError)
        client.sendCommand(new Protocol.messages.SetLEDRGBCommand(0, 0, 0), t.ifError)
      })

      test('echo', function (t) {
        t.plan(2)
        var echo = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        client.sendRequest(new Protocol.messages.EchoRequest(echo), function (err, response) {
          t.ifError(err)
          t.deepEqual(echo, response.echo)
        })
      })

      test('blocks present', function (t) {
        t.plan(2)
        client.sendRequest(new Protocol.messages.GetAllBlocksRequest(), function (err, response) {
          t.ifError(err, 'no response error')
          var passive = __(response.blocks).find(function (block) {
            return block.id === config.construction.type.passive
          })
          t.ok(passive, 'has a passive')
        })
      })

      test('ping', function (t) {
        t.plan(5)
        var pongCode = .code
        var id = config.construction.type.passive
        var payload = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        var pingRequest = new blockMessages.PingRequest(id, payload)
        client.on('event', function listener(e) {
          if (e instanceof Protocol.messages.ReadBlockMessageEvent && e.blockMessage instanceof Protocol.Block.messages.PongResponse) {
            var pongResponse = e.blockMessage
            if (pongResponse.id === id) {
              t.pass('read pong message')
              t.equal(pongResponse.payload.length, payload.length, 'equal size')
              t.deepEqual(pongResponse.payload, payload, 'equivalent payload')
              client.removeListener('event', listener)
            }
          }
        })
        client.sendRequest(new Protocol.messages.WriteBlockMessageRequest(pingRequest), function (err, response) {
          t.ifError(err, 'no response error')
          t.equal(0, response.result, 'wrote ping message')
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
