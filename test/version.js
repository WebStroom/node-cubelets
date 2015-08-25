var test = require('tape')
var Version = require('../version')

function parseVersion(floatValue) {
  var major = Math.floor(floatValue)
  var minor = Math.floor(10 * (floatValue - major))
  return new Version(major, minor)
}

test('algo', function (t) {
  t.plan(3)
  t.ok(parseVersion(3.1).isEqual(new Version(3, 1, 0)))
  t.ok(parseVersion(2.6000000000000001).isEqual(new Version(2, 6, 0)))
  t.ok(parseVersion(2.1000000000000001).isEqual(new Version(2, 1, 0)))
})

test('logic', function (t) {
  t.plan(4)
  
  var zero = new Version(0, 0, 0)
  var three_one = new Version(3, 1, 0)
  
  t.notOk(zero.isGreaterThanOrEqual(three_one), "0.0.0 should not be isGreaterThanOrEqual 3.1.0")
  t.ok(zero.isLessThan(three_one), "0.0.0 should be isLessThan 3.1.0")
  t.ok(zero.isLessThanOrEqual(three_one), "0.0.0 should be isLessThanOrEqual 3.1.0")
  t.ok(zero.isGreaterThanOrEqual(zero), "0.0.0 should be isGreaterOrEqual 0.0.0")
  
})
