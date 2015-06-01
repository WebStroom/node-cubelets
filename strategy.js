function Strategy(protocol, client) {

  var messages = protocol.messages

  this.sendMessage = function (message, callback) {
    client.sendData(message.encode(), callback)
  }

  this.sendCommand = function (command, callback) {
    client.sendMessage(command, callback)
  }

  this.sendRequest = function (request, callback, timeout) {
    if (typeof callback !== 'function') {
      client.sendMessage(request)
      return
    }

    timeout = timeout || client._defaultTimeout

    var timer = setTimeout(function () {
      client.removeListener('response', waitForResponse)
      if (callback) {
        callback(new Error('Timed out waiting for response to request: ' + request.code()))
      }
    }, timeout)

    function waitForResponse(response) {
      if (protocol.requestCodeForResponseCode(response.code()) === request.code()) {
        clearTimeout(timer)
        client.removeListener('response', waitForResponse)
        if (callback) {
          callback(null, response)
        }
      }
    }

    client.on('response', waitForResponse)
    client.sendMessage(request)
  }

  this.sendBlockRequest = function (blockRequest, callback, timeout) {
    throw new Error('not implemented')
  }

  this.keepAlive = function (callback) {
    throw new Error('not implemented')
  }

  this.echo = function (data, callback) {
    throw new Error('not implemented')
  }

  this.getConfiguration = function (callback) {
    throw new Error('not implemented')
  }

  this.setBlockValue = function (id, value, callback) {
    client.sendCommand(new messages.SetBlockValueCommand(id, value), callback)
  }

  this.clearBlockValue = function (id, callback) {
    throw new Error('not implemented')
  }

  this.setBlockValueEventEnabled = function (enabled, callback) {
    throw new Error('not implemented')
  }

}

module.exports = Strategy
