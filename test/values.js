var fs = require('fs')
var test = require('tape')
var config = require('./config')
var cubelets = require('../index')
var Protocol = cubelets.Protocol

test('skinny packets', function (t)  {
  var numTotalReads = 500
  var numTotalWrites = 500
  var writeInterval = 1000/10

  var writeIDs = [
    config.construction.passive.id,
    config.construction.knob.id,
    config.construction.flashlight.id
  ]

  t.plan(1 + numReads + numWrites + 1)

  var client = cubelets.connect(config.device, function (err) {
    if (err) {
      t.end(err)
    } else {
      // Listen for reads
      client.on('event', function listener(e) {
        if (e instanceof Protocol.messages.BlockValueEvent) {
          numReads++
          t.pass('read ' + numReads)
        }
      })

      // Enable block value events (1+)
      client.sendRequest(new Protocol.messages.RegisterBlockValueRequest(true), function (err, response) {
        if (err) {
          t.end(err)
        } else if (response.result !== 0) {
          t.fail('register fail')
        } else {
          t.pass('register success')
        }
      })

      // Start writes
      var numWrites = 0
      var writeTimer = setInterval(function () {
        client.sendCommand(new Protocol.messages.SetBlockValueCommand())
        numWrites++
        t.pass('write ' + numWrites)
        if (numTotalWrites === numWrites) {
          clearInterval(writeTimer)
        }
      }, writeInterval)

      // Fail on errors
      client.on('error', function (err) {
        client.disconnect()
        t.end(err)
      })

        // Pass timer to check read and write counts
      var passTimer = setInterval(function () {
        if (numReads === numTotalReads && numWrites === numTotalWrites) {
          clearInterval(passTimer)
          client.disconnect(t.error) // +1
        }
      })
    }
  })
})
