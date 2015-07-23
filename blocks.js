var util = require('util')
var events = require('events')
var Cubelet = require('./cubelet')
var __ = require('underscore')

function Blocks() {
  var self = this
  events.EventEmitter.call(self)

  var origin = null
  var idMap = {}
  var hopCountMap = { 0: [], 1: [], 2: [] }

  self.getAll = function () {
    return __(idMap).chain()
      .values()
      .sortBy(function (block) {
        return block.hopCount
      })
      .filter(function (block) {
        return block.hopCount > 0
      })
      .value()
  }

  self.findByBlockId = function (blockId) {
    return __(idMap).find(function (block, otherBlockId) {
      return otherBlockId === blockId
    })
  }

  self.filterByHopCount = function (hopCount) {
    return hopCountMap[hopCount] || []
  }

  self.getOrigin = function () {
    return origin
  }

  self.setOrigin = function (blockId, type) {
    origin = self.upsert(blockId, 0, type)
  }

  self.upsert = function (blockId, hopCount, type) {
    var block = exists(blockId)
    var updated = false
    if (block) {
      if (hopCount !== block.hopCount) {
        var fromHopCount = block.hopCount
        moveRank(block, hopCount)
        moved.push(block)
        self.emit('moveBlock', block, fromHopCount)
        updated = true
      }
    } else {
      block = new Cubelet(blockId, hopCount, type)
      addBlockId(block)
      addRank(block)
      self.emit('addBlock', block)
      updated = true
    }
    if (updated) {
      self.emit('updateBlocks')
    }
    return block
  }

  function exists(blockId) {
    return idMap[blockId]
  }

  function addBlock(block) {
    addBlockId(block)
    addRank(block)
  }

  function removeBlock(block) {
    removeBlockId(block)
    removeRank(block)
  }

  function addBlockId(block) {
    idMap[block.blockId] = block
  }

  function removeBlockId(block) {
    delete idMap[block.blockId]
  }

  function getRank(hopCount) {
    var rank = hopCountMap[hopCount]
    if (!__(rank).isArray()) {
      rank = hopCountMap[hopCount] = []
    }
    return rank
  }

  function addRank(block) {
    getRank(block.hopCount).push(block)
  }

  function removeRank(block) {
    var rank = getRank(block.hopCount)
    var i = __(rank).indexOf(block)
    if (i > -1) {
      rank.splice(i, 1)
    }
  }

  function moveRank(block, toHopCount) {
    if (toHopCount !== block.hopCount) {
      removeRank(block)
      block.hopCount = toHopCount
      addRank(block)
    }
  }

  return self
}

util.inherits(Blocks, events.EventEmitter)

module.exports = Blocks
