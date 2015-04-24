var redtape = require('redtape')
var cubelets = require('../index')
var Decoder = require('../decoder')
var Client = require('../client/index')
var device = require('./config.json').device

var cn = new Client().connect(device, function (err, construction) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('commands', function (t) {
        t.plan(3)
        cn.sendCommand(new cubelets.SetBlockValue(0, 0), t.ifError)
        cn.sendCommand(new cubelets.SetLEDColor(0), t.ifError)
        cn.sendCommand(new cubelets.SetLEDRGB(0, 0, 0), t.ifError)
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
        var id = Decoder.decodeID(new Buffer([ 0x03, 0x02, 0x01 ]))
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
          t.equal(0, response.result, 'write ping message')
        })
      })

      test('requests', function (t) {

      })

      test('events', function (t) {

      })

      test('targeted messages', function (t) {

      })

      test('round trip targeted message', function (t) {
        
      })
    }
  })
})
