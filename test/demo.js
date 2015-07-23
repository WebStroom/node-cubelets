var test = require('tape')
var DemoClient = require('../client/demo')
var cubelets = DemoClient

test('demo client', function (t) {
  t.plan(6)

  var GetConfigurationRequest = cubelets.Protocol.messages.GetConfigurationRequest

  var client = cubelets.connect({
    name: 'Demo Cubelet',
    deviceId: 1337
  }, function (err) {
    t.ifError(err, 'no connect err')
    t.pass('connect callback')
    client.sendRequest(new GetConfigurationRequest(), function (err, response) {
      t.ifError(err, 'no request err')
      t.ok(response, 'response ok')
      client.disconnect(function (err) {
        t.ifError(err, 'no disconnect err')
        t.pass('disconnected')
      })
    })
  })
})

test('get neighbor blocks', function (t) {
  t.plan(6)

  var m = cubelets.Protocol.messages
  var GetAllBlocksRequest = m.GetAllBlocksRequest
  var GetNeighborBlocksRequest = m.GetNeighborBlocksRequest

  var client = cubelets.connect({
    name: 'Demo Cubelet',
    deviceId: 1337
  }, function (err) {
    t.ifError(err, 'no connect err')
    t.pass('connect callback')
    var demo = client.getConnection().getDemo()
    client.fetchConfiguration(function (err) {
      t.ok(client.getOriginBlock(), 'has origin block')
      demo.addBlock({ blockId: 1, faceIndex: 1, hopCount: 1 })
      demo.addBlock({ blockId: 2, faceIndex: 2, hopCount: 1 })
      client.sendRequest(new GetNeighborBlocksRequest(), function (err, response) {
        t.equal(response.blocks.length, 2, 'responds with 2 blocks')
        client.disconnect(function (err) {
          t.ifError(err, 'no disconnect err')
          t.pass('disconnected')
        })
      })
    })
  })
})
