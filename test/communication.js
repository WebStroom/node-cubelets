var test = require('tape')
var cubelets = require('../index')
var Client = require('../client/index')
var device = require('./config').device

var cn = new Client().connect(device, function (err, construction) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('commands', function (t) {
        t.plan(3)
        cn.sendCommand(new cubelets.SetBlockValueCommand(0, 0), t.ifError)
        cn.sendCommand(new cubelets.SetLEDColorCommand(0), t.ifError)
        cn.sendCommand(new cubelets.SetLEDRGBCommand(0, 0, 0), t.ifError)
      })

      test('echo', function (t) {
        t.plan(2)
        var echo = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        cn.sendRequest(new cubelets.EchoRequest(echo), function (err, response) {
          t.ifError(err)
          t.deepEqual(echo, response.echo)
        })
      })

      test('ping', function (t) {
        t.plan(5)
        var pingCode = 0xA4
        var pongCode = 0xA5
        var payload = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        var id = Decoder.decodeID(config.construction.passive)
        cn.on('event', function listener(e) {
          if (e instanceof cubelets.ReadBlockMessageEvent) {
            if (e.type === pongCode && e.id === id) {
              t.pass('read pong message')
              t.equal(e.size, payload.length, 'equal size')
              t.deepEqual(e.data, payload, 'equivalent payload')
              cn.removeListener('event', listener)
            }
          }
        })
        cn.sendRequest(new cubelets.WriteBlockMessageRequest(pingCode, id, payload.length, payload), function (err, response) {
          t.ifError(err, 'no write error')
          console.log('res', response)
          t.equal(0, response.result, 'write ping message')
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        cn.disconnect(t.ifError)
      })
    }
  })
})
