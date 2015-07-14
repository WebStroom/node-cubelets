var fs = require('fs')
var test = require('tape')
var config = require('./config')
var cubelets = require('../index')


var cubeletIDs = {
  flashlight: config.construction.type.flashlight,
  bargraph: config.construction.type.bargraph
}

test('connect', function (t) {
  t.plan(1)

  var client = cubelets.connect(config.device, function (err) {
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('write packets', function (t) {
        var n = 100000
        t.plan(n)

        var value = 0
        var timer = setInterval(function () {
          if (n-- > 0) {
            value = value === 255 ? 0 : value + 1
            t.pass('wrote values ' + value)
            client.setManyBlockValues([
              { id: cubeletIDs.flashlight, value: value },
              { id: cubeletIDs.bargraph, value: value }
            ])
          } else {
            clearInterval(timer)
          }
        }, 10)
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
