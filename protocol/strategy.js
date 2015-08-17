function Strategy(protocol, client) {

  var messages = protocol.messages

  this.ping = function (callback) {
    throw new Error('not implemented')
  }

  var keepAliveTimer = null

  this.startKeepAliveTimer = function (interval, timeout) {
    client.stopKeepAliveTimer()
    timeout = timeout || client.getDefaultTimeout()
    interval = interval || (2 * timeout)
    keepAliveTimer = setInterval(function () {
      client.ping(function (err) {
        if (err) {
          client.stopKeepAliveTimer()
          client.emit('error', new Error('Keep alive timer expired.'))
          client.emit('die')
        }
      }, timeout)
    }, interval)
  }

  this.stopKeepAliveTimer = function () {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer)
      keepAliveTimer = null
    }
  }

  this.echo = function (data, callback) {
    throw new Error('not implemented')
  }

  this.getConfiguration = function () {
    throw new Error('not implemented')
  }

  this.fetchConfiguration = function (callback) {
    throw new Error('not implemented')
  }
  
  this.getOriginBlock = function () {
    throw new Error('not implemented')
  }

  this.fetchOriginBlock = function (callback) {
    throw new Error('not implemented')
  }

  this.getNeighborBlocks = function () {
    throw new Error('not implemented')
  }

  this.fetchNeighborBlocks = function (callback) {
    throw new Error('not implemented')
  }

  this.getBlocks = function () {
    throw new Error('not implemented')
  }

  this.getAllBlocks = function () {
    throw new Error('not implemented')
  }

  this.fetchBlocks = function (callback) {
    throw new Error('not implemented')
  }

  this.fetchAllBlocks = function (callback) {
    throw new Error('not implemented')
  }

  this.getGraph = function () {
    throw new Error('not implemented')
  }

  this.fetchGraph = function () {
    throw new Error('not implemented')
  }

  this.findBlockById = function (blockId) {
    throw new Error('not implemented')
  }

  this.filterBlocksByHopCount = function (hopCount) {
    throw new Error('not implemented')
  }

  this.setBlockValue = function (blockId, value, callback) {
    throw new Error('not implemented')
  }

  this.setManyBlockValues = function (blocks, callback) {
    throw new Error('not implemented')
  }

  this.clearBlockValue = function (blockId, callback) {
    throw new Error('not implemented')
  }

  this.clearManyBlockValues = function (blocks, callback) {
    throw new Error('not implemented')
  }

  this.clearAllBlockValues = function (callback) {
    throw new Error('not implemented')
  }

  this.registerBlockValueEvent = function (blockId, callback) {
    client.sendRequest(new messages.RegisterBlockValueEventRequest(blockId), callback)
  }

  this.unregisterBlockValueEvent = function (blockId, callback) {
    client.sendRequest(new messages.UnregisterBlockValueEventRequest(blockId), callback)
  }

  this.unregisterAllBlockValueEvents = function (callback) {
    client.sendRequest(new messages.UnregisterAllBlockValueEventsRequest(), callback)
  }

  this.sendBlockRequest = function (blockRequest, callback, timeout) {
    throw new Error('not implemented')
  }

  this.uploadProgramToMemory = function (program, slot, callback) {
    throw new Error('not implemented')
  }

  this.flashMemoryToBlock = function (blockId, slotIndex, callback) {
    throw new Error('not implemented')
  }

  this.flashProgramToBlock = function (program, block, callback) {
    throw new Error('not implemented')
  }
}

module.exports = Strategy
