var test = require('tape')
var fs = require('fs')
var config = require('../config')
var cubelets = require('../../index')
var UpgradeProtocol = require('../../protocol/bootstrap/upgrade')
var Upgrade = require('../../upgrade')

var bluetoothBlockId = config.map.type.bluetooth

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      var upgrade = new Upgrade(client)

      test('detect upgrade firmware?', function (t) {
        t.plan(4)
        upgrade.detectIfNeeded(function (err, needsUpgrade, firmwareType) {
          t.ifError(err, 'detect ok')
          t.equal(firmwareType, 2, 'has upgrade firmware')
          client.setProtocol(UpgradeProtocol)
          client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(0), function (err, response) {
            t.ifError(err, 'set mode ok')
            t.equal(response.mode, 0, 'jumped to os3')
          })
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
