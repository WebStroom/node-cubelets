var test = require('tape')
var config = require('./config')
var cubelets = require('../index')
var Upgrade = require('../upgrade')
var UpgradeProtocol = require('../protocol/bootstrap/upgrade')
var __ = require('underscore')

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      var upgrade = new Upgrade(client)

      test('detect firmware', function (t) {
        t.plan(3)
        upgrade.detectIfNeeded(function (err, needsUpgrade, firmwareType) {
          t.ifError(err, 'no err')
          t.ok(needsUpgrade, 'needs upgrade')
          t.equal(firmwareType, 0, 'has classic firmware')
        })
      })

      test('jump to os4', function (t) {
        client.setProtocol(UpgradeProtocol)
        client.setRequest(UpgradeProtocol.messages.SetBootstrapModeRequest(1), function (err, response) {
          t.ifError(err)
          t.equals(response.mode, 1)
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
