var test = require('tape')
var fs = require('fs')
var config = require('../config')
var cubelets = require('../../index')
var Upgrade = require('../../upgrade')
var UpgradeProtocol = require('../../protocol/bootstrap/upgrade')
var ClassicProtocol = require('../../protocol/classic')
var ImagoProtocol = require('../../protocol/imago')

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      var upgrade = new Upgrade(client)

      test('force into bootstrap from bootloader', function (t) {
        t.plan(1)
        client.getConnection().write(new Buffer(['L'.charCodeAt(0)]))
        t.pass('force')
      })

      test('detect bootstrap', function (t) {
        t.plan(3)
        upgrade.detectIfNeeded(function (err, needsUpgrade, firmwareType) {
          t.ifError(err, 'no err')
          t.ok(needsUpgrade, 'needs upgrade')
          t.equal(firmwareType, 2, 'has bootstrap firmware')
        })
      })

      test('discovery mode', function (t) {
        t.plan(1)
        var timer = setTimeout(function () {
          client.removeListener('event', waitForBlockEvent)
          t.fail('no block found events')
        }, 1000)
        function waitForBlockEvent(e) {
          if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
            clearTimeout(timer)
            client.removeListener('event', waitForBlockEvent)
            t.pass('got a block found event')
          }
        }
        client.on('event', waitForBlockEvent)
      })

      test('jump to os3 and back to discovery', function (t) {
        t.plan(3)
        client.setProtocol(UpgradeProtocol)
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(0), function (err, response) {
          t.ifError(err)
          t.equals(response.mode, 0, 'jumped to os3')
          client.setProtocol(ClassicProtocol)
          client.sendCommand(new ClassicProtocol.messages.ResetCommand())
          setTimeout(function () {
            client.setProtocol(UpgradeProtocol)
            var timer = setTimeout(function () {
              client.removeListener('event', waitForBlockEvent)
              t.fail('no block found events')
            }, 3000)
            function waitForBlockEvent(e) {
              if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
                clearTimeout(timer)
                client.removeListener('event', waitForBlockEvent)
                t.pass('jumped back to discovery')
              }
            }
            client.on('event', waitForBlockEvent)
          }, 500)
        })
      })

      test.skip('jump to os4', function (t) {
        t.plan(2)
        client.setProtocol(UpgradeProtocol)
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(1), function (err, response) {
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
