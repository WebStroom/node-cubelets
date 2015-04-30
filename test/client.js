var redtape = require('redtape')
var cubelets = require('../index')
var Client = require('../client/index')
var device = require('./config').device

var test = redtape(function before(cb) {
  var connection = new Client().connect(device, function (err, construction) {
    if (err) {
      cb(err)
    } else {
      cb(null, connection, construction)
    }
  })
}, function after(connection, construction, cb) {
  cn.disconnect(cb)
})

test('construction', function (t, connection, construction) {
  t.plan(3)

  var cn = connection
  var c = construction
  c.on('change', function listener(added, removed) {
    if (added.length > 0) {
      c.removeListener('change', listener)
      t.pass('added cubelet')
    }
  })
  c.on('change', function listener(added, removed) {
    if (removed.length > 0) {
      c.removeListener('change', listener)
      t.pass('removed cubelet')
    }
  })
  c.discover(function (err) {
    if (err) {
      t.fail(err)
      cn.disconnect()
    }
  })
})
