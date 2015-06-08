var test = require('tape')
var NetClient = require('../client/net')
var NetServer = require('../server/net')
var cubelets = NetClient

var port = 9000
var connection
var server = NetServer.createServer(function (newConnection) {
  connection = newConnection
})
server.listen(port, function () {
  console.log('server listening on port', port)
})

test('net client', function (t) {
  t.plan(6)

  var GetConfigurationRequest = cubelets.Protocol.messages.GetConfigurationRequest

  var client = cubelets.connect({
    port: port
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

  var GetNeighborBlocksRequest = cubelets.Protocol.messages.GetNeighborBlocksRequest

  var client = cubelets.connect({
    port: port
  }, function (err) {
    t.ifError(err, 'no connect err')
    t.pass('connect callback')
    client.sendRequest(new GetNeighborBlocksRequest(), function (err, response) {
      t.equal(response.blocks.length, 0, 'has no blocks')
      connection.addBlock({ id: 1, faceIndex: 1, hopCount: 1 })
      connection.addBlock({ id: 2, faceIndex: 2, hopCount: 1 })
      client.sendRequest(new GetNeighborBlocksRequest(), function (err, response) {
        t.equal(response.blocks.length, 2, 'has 2 blocks')
        client.disconnect(function (err) {
          t.ifError(err, 'no disconnect err')
          t.pass('disconnected')
        })
      })
    })
  })
})

test('close', function (t) {
  t.plan(1)
  server.close()
  t.pass('server closed')
})