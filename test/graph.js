var test = require('tape')
var config = require('./config')
var cubelets = require('../index')
var Protocol = cubelets.Protocol

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('get configuration', function (t) {
        t.plan(2)
        client.fetchConfiguration(function (err, res) {
          t.ifError(err, 'no err')
          t.ok(res, 'response ok')
          console.log('configuration', res)
        })
      })

      test('get neighbors', function (t) {
        t.plan(2)
        client.fetchAllBlocks(function (err, res) {
          t.ifError(err, 'no err')
          t.ok(res, 'response ok')
          console.log('all blocks', res)
        })
      })

      test('get block neighbors', function (t) {
        t.plan(2)
        var blockId = config.construction.type.passive
        var GetNeighborsRequest = Protocol.Block.messages.GetNeighborsRequest
        client.sendBlockRequest(new GetNeighborsRequest(blockId), function (err, res) {
          t.ifError(err, 'no get neighbors err')
          t.ok(res, 'response ok')
          console.log('neighbors', res)
        })
      })

      test.skip('graph', function (t) {
        t.plan(2)
        client.fetchGraph(function (err) {
          t.ifError(err, 'no fetch graph err')
          var graph = client.getGraph()
          t.ok(graph, 'graph ok')
          console.log('graph', graph)
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
