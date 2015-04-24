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
  c.once('change', function (added, removed) {
    if (added.length > 0) {
      t.pass('added cubelet')
    }
  })
  // c.once('change', function (added, removed) {
  //   if (removed.length > 0) {
  //     t.pass('removed cubelet')
  //   }
  // })
  c.once('origin', function (origin) {
    t.ok(origin, 'origin')
  })
  c.once('neighborhood', function (neighborhood) {
    t.ok(neighborhood, 'neighborhood')
  })
  c.discover(function (err) {
    if (err) {
      t.fail(err)
      cn.disconnect()
    }
  })
})


