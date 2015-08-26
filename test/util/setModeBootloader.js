var test = require('tape')
var config = require('../config')
var cubelets = require('../../index')
var ImagoProtocol = require('../../protocol/imago')
var __ = require('underscore')

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('jump to bootloader', function (t) {
        t.plan(2)
        var req = new ImagoProtocol.messages.SetModeRequest(0)
        client.sendRequest(req, function (err, res) {
          t.ifError(err)
          t.equal(res.mode, 0)
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
