var test = require('tape')
var device = require('./config').device
var cubelets = require('../index')
var Client = require('../client/index')

test('flood', function (t) {
  t.plan(100 + 1)

  var cn = new Client.Connection(device)

  cn.connect(function (err) {
    if (err) {
      t.end(err)
    } else {
      var buffers = []
      for (var i = 0; i < 100; ++i) {
        buffers.push(new Buffer(new cubelets.GetConfigurationRequest().encode()))
      }
      var data = Buffer.concat(buffers)
      var n = 0
      cn.on('response', function listener(response) {
        ++n
        t.pass('response ' + n)
        if (n === 100) {
          cn.disconnect(t.error) // +1
        }
      })
      cn.on('error', function (err) {
        console.error(err)
        cn.disconnect()
        t.end()
      })
      cn.sendData(data, function (err) {
        if (err) {
          console.error(err)
          cn.disconnect()
        } 
      })
    }
  })
})