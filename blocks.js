var util = require('util')
var events = require('events')
var Cubelet = require('./cubelet')
var xtend = require('xtend/mutable')
var __ = require('underscore')

function Blocks() {
  var self = this
  events.EventEmitter.call(self)

  var origin = null
  var idMap = {}
  var hopCountMap = { 0: [], 1: [], 2: [] }
  var neighborsMap = {}

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
    var nodes = []
    var links = []

    var originBlock = self.getOrigin()
    if (originBlock) {
      nodes.push(originBlock)
    }

    var allBlocks = self.getAll()
    __(allBlocks).each(function (block) {
      nodes.push(block)
    })

    function indexOf(blockId) {
      return __(nodes).findIndex(function (node) {
        return node.blockId === blockId
      })
    }

    function addLinks(block) {
      var blockId = block.blockId
      __(block.neighbors).each(function (neighborId, faceIndex) {
        links.push({
          source: indexOf(blockId),
          target: indexOf(neighborId),
          faceIndex: parseInt(faceIndex, 10)
        })
      })
    }

    if (origin) {
      addLinks(origin)
    }

    __(allBlocks).each(function (block) {
      addLinks(block)
    })

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
    return hopCountMap[hopCount] || []
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
      if (updateRank(block, hopCount)) {
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
      setBlock(blockId, block)
      setRank(blockId, hopCount)
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

  function setBlock(blockId, block) {
    idMap[blockId] = block
  }

  function clearBlock(blockId) {
    delete idMap[blockId]
  }

  function getRank(hopCount) {
    var rank = hopCountMap[hopCount]
    if (!__(rank).isArray()) {
      rank = hopCountMap[hopCount] = []
    }
    return rank
  }

  function setRank(blockId, hopCount) {
    getRank(hopCount).push(blockId)
  }

  function clearRank(blockId, hopCount) {
    var rank = getRank(hopCount)
    var i = __(rank).indexOf(blockId)
    if (i > -1) {
      rank.splice(i, 1)
    }
  }

  function setNeighbors(blockId, neighbors) {
    neighborsMap[blockId] = neighbors
  }

  function clearNeighbors(blockId) {
    delete neighborsMap[blockId]
  }

  function updateRank(block, hopCount) {
    var updated = false
    var blockId = block.blockId
    if (hopCount !== undefined && hopCount !== block.hopCount) {
      clearRank(blockId, block.hopCount)
      block.hopCount = hopCount
      setRank(blockId, block.hopCount)
      updated = true
    }
    return updated
  }

  function updateNeighbors(block, neighbors) {
    var updated = false
    var blockId = block.blockId
    if (neighbors !== undefined && !__.isEqual(neighbors, block.neighbors)) {
      block.neighbors = neighbors
      setNeighbors(blockId, neighbors)
      updated = true
    }
    return updated
  }

  function updateBlockType(block, blockType) {
    var updated = false
    if (undefined !== blockType) {
      block.blockType = blockType
      updated = true
    }
    return updated
  }

  return self
}

util.inherits(Blocks, events.EventEmitter)

module.exports = Blocks
