var util = require('util')
var events = require('events')
var BlockTypes = require('../blockTypes')
var MCUTypes = require('../mcuTypes')

function CompatibilityCheck(client) {
  var self = this
  events.EventEmitter.call(self)

  var unknownBlocks = []
  var compatibleBlocks = []
  var notCompatibleBlocks = []
  var fetchTimer = null
  var fetchInterval = 4000

  this.getCompatibleBlocks = function () {
    return compatibleBlocks
  }

  this.getNotCompatibleBlocks = function () {
    return notCompatibleBlocks
  }

  this.start = function (callback) {
    if (fetchTimer) {
      callback(null)
    } else {
      client.fetchAllBlocks(function (err, blocks) {
        if (err) {
          callback(err)
        } else {
          unknownBlocks = filterUnknownBlocks(blocks)
          fetchUnknownBlockTypes(unknownBlocks, function (err) {
            if (err) {
              callback(err)
              self.emit('error', err)
            } else {
              if (unknownBlocks.length > 0) {
                self.emit('found', blocks)
                checkUnknownBlocks()
              }
              callback(null)
              fetchTimer = setInterval(
                fetchMoreBlocks, 
                fetchInterval
              )
            }
          })
        }
      })
    }
  }

  function fetchMoreBlocks() {
    client.fetchNeighborBlocks(function (err, blocks) {
      unknownBlocks = filterUnknownBlocks(blocks)
      fetchUnknownBlockTypes(function (err) {
        if (err) {
          self.emit('error', err)
        } else {
          if (blocks.length > 0) {
            self.emit('found', blocks)
            checkBlocks()
          }
          callback(null)
        }
      })
    })
  }

  this.finish = function () {
    if (fetchTimer) {
      clearTimeout(fetchTimer)
      fetchTimer = null
    }
  }

  function filterUnknownBlocks(blocks) {
    return __(blocks).filter(function (block) {
      return block.getBlockType() === BlockTypes.UNKNOWN
    })
  }

  function fetchUnknownBlockTypes(callback) {
    var service = new InfoService()

    service.on('info', function (info, block) {
      var blockType = Block.blockTypeForId(info.blockTypeId)
      if (blockType !== BlockTypes.UNKNOWN) {
        block._blockType = blockType
      }
      var mcuType = Block.mcuTypeForId(info.mcuString)
      if (mcuType !== MCUTypes.UNKNOWN) {
        block._mcuType = mcuType
      }
    })

    service.fetchBlockInfo(unknownBlocks, function (err) {
      service.removeAllListeners('info')
      callback(err)
    })
  }

  function checkUnknownBlocks() {
    __(unknownBlocks).each(function (block) {
      var mcuType = block.getMCUType()
      if (mcuType === MCUTypes.AVR) {
        notCompatibleBlocks.push(block)
        self.emit('notCompatible', block)
      } else if (mcuType === MCUTypes.PIC) {
        compatibleBlocks.push(block)
        self.emit('compatible', block)
      }
    })
    unknownBlocks = __(unknownBlocks)
      .difference(compatibleBlocks.concat(notCompatible))
  }
}

util.inherits(CompatibilityCheck, events.EventEmitter)

module.exports = CompatibilityCheck
