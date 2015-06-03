var redtape = require('redtape')
var cubelets = require('../index')
var device = require('./config').device

var test = redtape(function before(cb) {
  var client = cubelets.connect(device, function (err) {
    if (err) {
      cb(err)
    } else {
      cb(null, client)
    }
  })
}, function after(client, cb) {
  client.disconnect(cb)
})

test('construction', function (t, client) {
  t.plan(3)

  client.on('updateBlocks', function listener(added, removed) {
    if (added.length > 0) {
      c.removeListener('updateBlocks', listener)
      t.pass('added cubelet')
    }
  })
  client.on('updateBlocks', function listener(added, removed) {
    if (removed.length > 0) {
      c.removeListener('updateBlocks', listener)
      t.pass('removed cubelet')
    }
  })
  client.getAllBlocks(function (err) {
    if (err) {
      t.fail(err)
      client.disconnect()
    }
  })
})
