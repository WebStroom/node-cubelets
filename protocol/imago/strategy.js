var util = require('util')
var Strategy = require('../../strategy')

function ImagoStrategy(protocol, client) {
  Strategy.call(this, protocol, client)

  var messages = protocol.messages

  this.sendBlockRequest = function (blockRequest, callback, timeout) {
    var writeBlockRequest = new messages.WriteBlockMessageRequest(blockRequest)

    timeout = timeout || client._defaultTimeout

    var timer = setTimeout(function () {
      client.removeListener('event', waitForBlockResponse)
      if (callback) {
        callback(new Error('Timed out waiting for block response to block request: ' + request.code()))
      }
    }, timeout)

    function waitForBlockResponse(e) {
      if (e.code() === messages.ReadBlockMessageEvent.code) {
        var blockResponse = e.blockMessage
        if (blockResponse.code() === blockRequest.code() && blockResponse.id === blockRequest.id) {
          clearTimeout(timer)
          client.removeListener('event', waitForBlockResponse)
          if (callback) {
            callback(null, blockResponse)
          }
        }
      }
    }

    function onRequestError(err) {
      client.removeListener('event', waitForBlockResponse)
      if (callback) {
        callback(err)
      }      
    }

    client.on('event', waitForBlockResponse)
    client.sendRequest(writeBlockRequest, function (err, response) {
      if (err) {
        onRequestError(err)
      } else if (response.result !== 0) {
        onRequestError(new Error('Failed to write block message with result: ' + response.result))
      }
    })
  }

  this.echo = function (data, callback, timeout) {
    client.sendRequest(new messages.EchoRequest(data), callback, timeout)
  }

  this.setBlockValueEventEnabled = function (enabled, callback, timeout) {
    client.sendRequest(new messages.RegisterBlockValueEventRequest(enabled), callback, timeout)
  }
}

util.inherits(ImagoStrategy, Strategy)
module.exports = ImagoStrategy
