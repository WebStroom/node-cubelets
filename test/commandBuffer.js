var test = require('tape')
var util = require('util')
var events = require('events')
var Client = require('../client/net')
var Server = require('../server/net')
var CommandBuffer = require('../protocol/commandBuffer')

var port = 9877
var connection

var server = Server.createServer(function (newConnection) {
  connection = newConnection
})

server.listen(port, function () {
  console.log('server listening on port', port)
})

var client = Client.connect({ port: port }, function (err) {
  if (err) {
    t.end(err)
  } else {
    var messages = client.getProtocol().messages
    var SetBlockValueCommand = messages.SetBlockValueCommand

    test('replace', function (t) {
      t.plan(1)

      var commandRate = 1000
      var b = new CommandBuffer(client, commandRate)

      var command0 = new SetBlockValueCommand(0xAABBCC, 22)
      var command1 = new SetBlockValueCommand(0xAABBCC, 42)

      // Send two messages before command rate.
      setTimeout(function () {
        b.push(command0)
        b.push(command1)
      }, 100)

      var lastCommand
      connection.on('command', function (command) {
        console.log(command)
        lastCommand = command
      })

      // Check to make sure the second one was sent after rate.
      setTimeout(function () {
        t.equal(command1.value, lastCommand.value)
        b.unref()
      }, 100 + commandRate)
    })

    test('disconnect', function (t) {
      t.plan(1)
      server.unref()
      server.removeAllListeners()
      client.disconnect(t.ifError)
    })
  }
})
