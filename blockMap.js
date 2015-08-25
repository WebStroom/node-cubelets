var util = require('util')
var events = require('events')
var Block = require('./block')
var BlockTypes = require('./blockTypes')
var __ = require('underscore')

function BlockMap() {
  var self = this
  events.EventEmitter.call(self)

  var idMap = {}
  var origin = null
  var nodes = []
  var links = []

  // Gets a map with blockIds as keys, and blocks as values.
  self.getIdMap = function () {
    return idMap
  }

  // Gets the origin block, having hop count zero.
  self.getOriginBlock = function () {
    return origin
  }

  // Sets the origin block, given a blockId and blockType.
  // @see BlockTypes.BLUETOOTH
  self.setOriginBlock = function (blockId, blockType) {
    origin = self.upsert({
      blockId: blockId,
      hopCount: 0,
      blockType: blockType
    })
  }

  // Returns an array of all known neighbor blocks in
  // the map, sorted by hop count.
  self.getNeighborBlocks = function () {
    return self.filterByHopCount(1)
  }

  // Returns an array of all known blocks in the map,
  // except for the origin block, sorted by hop count.
  self.getAllBlocks = function () {
    return __(idMap).chain()
      .values()
      .sortBy(function (block) {
        return block.getHopCount()
      })
      .filter(function (block) {
        return block.getHopCount() > 0
      })
      .value()
  }

  // Returns an object consisting of nodes, which are blocks,
  // and links, which denote source and target relationships
  // between blocks. This object is compatible with d3.js.
  self.getGraph = function () {
    return {
      nodes: nodes,
      links: links
    }
  }

  // Returns the block with the given blockId, or undefined
  // if the block is not known.
  self.findById = function (blockId) {
    return idMap[blockId]
  }

  // Returns an array of blocks with the given hop count.
  // Example: `filterByHopCount(1)` returns all direct neighbors
  // of the origin block.
  self.filterByHopCount = function (hopCount) {
    return __(nodes).filter(function (block) {
      return block.getHopCount() === hopCount
    })
  }

  // Given a chunk of block info, which must have a blockId,
  // inserts a new block if the blockId is not known, or
  // updates an existing block, merging in the new info.
  self.upsert = function (info) {
    var blockId = info.blockId
    var hopCount = info.hopCount
    var blockType = info.blockType
    var neighbors = info.neighbors
    var faceIndex = info.faceIndex

    var block = getBlock(blockId)
    var updated = false

    if (block) {
      if (updateHopCount(block, hopCount)) {
        updated = true
      }
      if (updateBlockType(block, blockType)) {
        updated = true
      }
      if (updateNeighbors(block, neighbors)) {
        updated = true
      }
      if (updateFaceIndex(block, faceIndex)) {
        updated = true
      }
    } else {
      // Since block doesn't exist, add it to the block construction.
      block = new Block(blockId, hopCount, blockType)
      addBlock(blockId, block)
      updateNeighbors(block, neighbors)
      updateFaceIndex(block, faceIndex)
      self.emit('addBlock', block)
      updated = true
    }

    if (updated) {
      self.emit('update')
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
    if (hopCount !== undefined && hopCount !== block._hopCount) {
      block._hopCount = hopCount
      return true
    } else {
      return false
    }
  }

  function updateNeighbors(block, neighbors) {
    var blockId = block.getBlockId()
    if (neighbors !== undefined && !__.isEqual(neighbors, block._neighbors)) {
      block._neighbors = neighbors
      __(neighbors).each(function (neighborId, faceIndex) {
        addLink(blockId, neighborId)
      })
      return true
    } else {
      return false
    }
  }

  function updateFaceIndex(block, faceIndex) {
    if (faceIndex !== undefined && faceIndex !== block._faceIndex) {
      block._faceIndex = faceIndex
      return true
    } else {
      return false
    }
  }

  function updateBlockType(block, blockType) {
    if (blockType !== undefined && blockType !== BlockTypes.UNKNOWN) {
      block._blockType = blockType
      return true
    } else {
      return false
    }
  }

  return self
}

util.inherits(BlockMap, events.EventEmitter)

module.exports = BlockMap
