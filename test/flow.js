var test = require('tape')
var device = require('./config').device
var cubelets = require('../index')
var Client = require('../client/index')

// test('echo flood', function (t)  {
//   t.plan(1)

//   var cn = new Client.Connection(device)

//   cn.connect(function (err) {
//     if (err) {
//       t.end(err)
//     } else {
//       var buffers = []
//       for (var i = 0; i < 100; ++i) {
//         buffers.push(new cubelets.EchoRequest(new Buffer([ i ])).encode())
//       }
//       var data = Buffer.concat(buffers)
//       var n = 0
//       cn.on('response', function listener(response) {
//         var payload = response.echo.readUInt8(0)
//         console.log(payload)
//         ++n
//         //t.pass('response ' + n)
//         if (n === 100) {
//           cn.disconnect(t.error) // +1
//         }
//       })
//       cn.on('error', function (err) {
//         console.error(err)
//         cn.disconnect()
//         t.end()
//       })
//       cn.sendData(data, function (err) {
//         if (err) {
//           cn.disconnect()
//         } 
//       })
//     }
//   })
// })

// test('echo flood', function (t)  {
//   t.plan(1 * 100 + 1)

//   var cn = new Client.Connection(device)

//   cn.connect(function (err) {
//     if (err) {
//       t.end(err)
//     } else {
//       var buffers = []
//       for (var i = 0; i < 100; ++i) {
//         buffers.push(new cubelets.EchoRequest(new Buffer([ i ])).encode())
//       }
//       var data = Buffer.concat(buffers)
//       var n = 0
//       cn.on('response', function listener(response) {
//         var payload = response.echo.readUInt8(0)
//         console.log('n =', payload)
//         ++n
//         t.pass('response ' + n)
//         if (n === 100) {
//           cn.disconnect(t.error) // +1
//         }
//       })
//       cn.on('error', function (err) {
//         console.error(err)
//         cn.disconnect()
//         t.end()
//       })
//       cn.sendData(data, function (err) {
//         if (err) {
//           cn.disconnect()
//         } 
//       })
//     }
//   })
// })

test('config flood', function (t) {
  var n = 100

  t.plan(n + 1)

  var cn = new Client.Connection(device)

  cn.connect(function (err) {
    if (err) {
      t.end(err)
    } else {
      var buffers = []
      for (var i = 0; i < n; ++i) {
        buffers.push(new cubelets.GetConfigurationRequest().encode())
      }
      var data = Buffer.concat(buffers)
      var x = 0
      cn.on('response', function listener(response) {
        ++x
        t.pass('response ' + x)
        if (x === n) {
          cn.disconnect(t.ifError) // +1
        }
      })
      cn.on('error', function (err) {
        console.error(err)
        cn.disconnect()
        t.end()
      })
      cn.sendData(data, function (err) {
        if (err) {
          cn.disconnect()
        } 
      })
    }
  })
})

// test('slow flood', function (t) {
//   var n = 100

//   t.plan(n + 1)

//   var cn = new Client.Connection(device)

//   cn.connect(function (err) {
//     if (err) {
//       t.end(err)
//     } else {
//       var x = 0
//       cn.on('response', function listener(response) {
//         ++x
//         t.pass('response ' + x)
//         if (x === n) {
//           cn.disconnect(t.ifError) // +1
//         }
//       })
//       cn.on('error', function (err) {
//         console.error(err)
//         cn.disconnect()
//         t.end()
//       })
//       for (var i = 0; i < n; ++i) {
//         cn.sendMessage(new cubelets.GetConfigurationRequest())
//       }
//     }
//   })
// })