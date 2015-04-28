var test = require('tape')
var cubelets = require('../index')
var Client = require('../client/index')
var Decoder = require('../decoder')
var config = require('./config')
var __ = require('underscore')

var cn = new Client().connect(config.device, function (err, construction) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      // test('commands', function (t) {
      //   t.plan(3)
      //   cn.sendCommand(new cubelets.SetBlockValueCommand(0, 0), t.ifError)
      //   cn.sendCommand(new cubelets.SetLEDColorCommand(0), t.ifError)
      //   cn.sendCommand(new cubelets.SetLEDRGBCommand(0, 0, 0), t.ifError)
      // })

      // test('echo', function (t) {
      //   t.plan(2)
      //   var echo = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      //   cn.sendRequest(new cubelets.EchoRequest(echo), function (err, response) {
      //     t.ifError(err)
      //     t.deepEqual(echo, response.echo)
      //   })
      // })

      // test('construction', function (t) {
      //   t.plan(2)
      //   cn.sendRequest(new cubelets.GetAllBlocksRequest(), function (err, response) {
      //     t.ifError(err, 'no response error')
      //     console.log('response', response)
      //     var passive = __(response.blocks).find(function (block) {
      //       return block.id === config.construction.type.passive
      //     })
      //     t.ok(passive, 'has a passive')
      //   })
      // })

      test('ping', function (t) {
        t.plan(5)
        var pingCode = cubelets.block.PingRequest.code
        var pongCode = cubelets.block.PongResponse.code
        var id = config.construction.type.passive
        var payload = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        var pingRequest = new cubelets.block.PingRequest(id, payload)
        cn.on('event', function listener(e) {
          if (e instanceof cubelets.ReadBlockMessageEvent) {
            var pongResponse = e.blockMessage
            if (pongResponse.code() === pongCode && pongResponse.id === id) {
              t.pass('read pong message')
              t.equal(pongResponse.payload.length, payload.length, 'equal size')
              t.deepEqual(pongResponse.payload, payload, 'equivalent payload')
              cn.removeListener('event', listener)
            }
          }
        })
        cn.sendRequest(new cubelets.WriteBlockMessageRequest(pingRequest), function (err, response) {
          console.log('response', response)
          t.ifError(err, 'no response error')
          t.equal(0, response.result, 'wrote ping message')
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        cn.disconnect(t.ifError)
      })
    }
  })
})
