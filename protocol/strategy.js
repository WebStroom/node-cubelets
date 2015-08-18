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

  this.getBlockMap = function () {
    throw new Error('not implemented')
  }

  this.getOriginBlock = function () {
    return this.getBlockMap().getOriginBlock()
  }

  this.getNeighborBlocks = function () {
    return this.getBlockMap().getNeighborBlocks()
  }

  this.getAllBlocks = function () {
    return this.getBlockMap().getAllBlocks()
  }

  this.getGraph = function () {
    return this.getBlockMap().getGraph()
  }

  this.findBlockById = function (blockId) {
    return this.getBlockMap().findById(blockId)
  }

  this.filterBlocksByHopCount = function (hopCount) {
    return this.getBlockMap().filterByHopCount(hopCount)
  }

  this.getConfiguration = function () {
    throw new Error('not implemented')
  }

  this.fetchConfiguration = function (callback) {
    throw new Error('not implemented')
  }

  this.fetchOriginBlock = function (callback) {
    throw new Error('not implemented')
  }

  this.fetchNeighborBlocks = function (callback) {
    throw new Error('not implemented')
  }

  this.fetchAllBlocks = function (callback) {
    throw new Error('not implemented')
  }

  this.fetchGraph = function () {
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
    throw new Error('not implemented')
  }

  this.unregisterBlockValueEvent = function (blockId, callback) {
    throw new Error('not implemented')
  }

  this.unregisterAllBlockValueEvents = function (callback) {
    throw new Error('not implemented')
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
