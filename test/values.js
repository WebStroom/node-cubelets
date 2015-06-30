var fs = require('fs')
var test = require('tape')
var config = require('./config')
var cubelets = require('../index')
var Protocol = cubelets.Protocol

var numTotalReads = 500
var numTotalWrites = 500
var writeInterval = 1000/10

function writeValue(t) {
  return 255 * Math.sin(t/10)
}

var cubeletIDs = [
  config.construction.passive,
  config.construction.knob,
  config.construction.flashlight
]

test.only('write data', function (t) {

  var data = new Buffer(0)
  for (var i = 0; i < 5000; ++i) {
    data = Buffer.concat([data, new Buffer([1, 2, 3, 4])])
  }

  var client = cubelets.connect(config.device, function (err) {
    if (err) {
      t.end(err)
    } else {
      client.sendData(data, Function())
    }
  })

})

test('write packets', function (t) {
  var n = 100

  t.plan(n)

  var client = cubelets.connect(config.device, function (err) {
    if (err) {
      t.end(err)
    } else {
      var value = 0
      var timer = setInterval(function () {
        if (n-- > 0) {
          value = value === 0 ? 255 : 0
          client.setManyBlockValues([
            { id: 855566, value: value },
            { id: 789258, value: value }
          ])
          t.pass('value ' + n)
        } else {
          console.log('done')
          clearInterval(timer)
        }
      }, 50)
    }
  })
})

test('fat packets', function (t) {
  t.plan(1 + numReads + numWrites + 1)

  //TODO
})

test('skinny packets', function (t)  {
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
      client.registerBlockValueEvent(function (err, res) {
        if (err) {
          t.end(err)
        } else if (response.result !== 0) {
          t.fail('register fail')
        } else {
          t.pass('register success')
        }
      })

      client.sendRequest(new Protocol.messages.RegisterBlockValueEventRequest(cubeletIDs), function (err, response) {
        if (err) {
          t.end(err)
        } else if (response.result !== 0) {
          t.fail('register fail')
        } else {
          t.pass('register success')
        }
      })

      // Start writes
      var writeTime = 0
      var numWrites = 0
      var writeTimer = setInterval(function () {
        //TODO:
        //client.sendCommand()
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
