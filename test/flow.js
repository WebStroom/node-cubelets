var fs = require('fs')
var test = require('tape')
var device = require('./config').device
var cubelets = require('../index')

test.only('echo flood', function (t)  {
  var n = 500

  t.plan(1 * n + 1)

  cubelets.connect(device, function (err, client) {
    if (err) {
      t.end(err)
    } else {
      var buffers = []
      var messages = cubelets.Protocol.messages
      for (var i = 0; i < n; ++i) {
        buffers.push(new messages.EchoRequest(new Buffer([ i ])).encode())
      }
      var data = Buffer.concat(buffers)
      var x = 0
      client.on('response', function listener(response) {
        var payload = response.echo.readUInt8(0)
        console.log('x =', payload)
        ++x
        t.pass('response ' + x)
        if (x === n) {
          client.disconnect(t.error) // +1
        }
      })
      client.on('error', function (err) {
        console.error(err)
        client.disconnect()
        t.end()
      })
      client.sendData(data, function (err) {
        if (err) {
          client.disconnect()
        } 
      })
    }
  })
})

test('config flood', function (t) {
  var n = 500

  t.plan(n + 1)

  cubelets.connect(device, function (err, client) {
    if (err) {
      t.end(err)
    } else {
      var buffers = []
      var messages = cubelets.Protocol.messages
      for (var i = 0; i < n; ++i) {
        buffers.push(new messages.GetConfigurationRequest().encode())
      }
      var data = Buffer.concat(buffers)
      var x = 0
      client.on('response', function listener(response) {
        ++x
        t.pass('response ' + x)
        if (x === n) {
          client.disconnect(t.ifError) // +1
        }
      })
      client.on('error', function (err) {
        console.error(err)
        client.disconnect()
        t.end()
      })
      client.sendData(data, function (err) {
        if (err) {
          client.disconnect()
        } 
      })
    }
  })
})
