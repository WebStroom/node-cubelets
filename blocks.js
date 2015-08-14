var util = require('util')
var events = require('events')
var Cubelet = require('./cubelet')
var BlockTypes = Cubelet.BlockTypes
var xtend = require('xtend/mutable')
var __ = require('underscore')

function Blocks() {
  var self = this
  events.EventEmitter.call(self)

  var origin = null
  var idMap = {}
  var nodes = []
  var links = []

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

  self.getGraph = function () {
    return {
      nodes: nodes,
      links: links
    }
  }

  self.findByBlockId = function (blockId) {
    return __(idMap).find(function (block, otherBlockId) {
      return otherBlockId === blockId
    })
  }

  self.filterByHopCount = function (hopCount) {
    return __(nodes).filter(function (block) {
      return block.hopCount === hopCount
    })
  }

  self.getOrigin = function () {
    return origin
  }

  self.setOrigin = function (blockId, blockType) {
    origin = self.upsert({
      blockId: blockId,
      hopCount: 0,
      blockType: blockType
    })
  }

  self.upsert = function (info) {
    var blockId = info.blockId
    var hopCount = info.hopCount
    var blockType = info.blockType
    var neighbors = info.neighbors

    var block = getBlock(blockId)
    var updated = false

    if (block) {
      if (updateHopCount(block, hopCount)) {
        updated = true
      }
      if (updateNeighbors(block, neighbors)) {
        updated = true
      }
      if (updateBlockType(block, blockType)) {
        updated = true
      }
    } else {
      // Since block doesn't exist, add it to the block construction.
      block = new Cubelet(blockId, hopCount, blockType)
      addBlock(blockId, block)
      self.emit('addBlock', block)
      updated = true
    }

    if (updated) {
      self.emit('updateBlocks')
    }

    return block
  }

  function getBlock(blockId) {
    return idMap[blockId]
  }

  function addBlock(blockId, block) {
    idMap[blockId] = block
    nodes.push(block)
  }

  function removeBlock(blockId) {
    delete idMap[blockId]
    var block = getBlock(blockId)
    var i = nodes.indexOf(block)
    if (i > -1) {
      nodes.splice(i, 1)
    }
  }

  function addLink(sourceId, targetId) {
    links.push({
      source: getBlock(sourceId),
      target: getBlock(targetId)
    })
  }

  function updateHopCount(block, hopCount) {
    var blockId = block.blockId
    if (hopCount !== undefined && hopCount !== block.hopCount) {
      block.hopCount = hopCount
      return true
    } else {
      return false
    }
  }

  function updateNeighbors(block, neighbors) {
    var blockId = block.blockId
    if (neighbors !== undefined && !__.isEqual(neighbors, block.neighbors)) {
      block.neighbors = neighbors
      __(neighbors).each(function (neighborId, faceIndex) {
        addLink(blockId, neighborId)
      })
      return true
    } else {
      return false
    }
  }

  function updateBlockType(block, blockType) {
    if (blockType !== undefined && blockType !== BlockTypes.UNKNOWN) {
      block.blockType = blockType
      return true
    } else {
      return false
    }
  }

  return self
}

util.inherits(Blocks, events.EventEmitter)

module.exports = Blocks
