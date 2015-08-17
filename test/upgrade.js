var test = require('tape')
var config = require('./config')
var cubelets = require('../index')
var Upgrade = require('../upgrade')
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

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
