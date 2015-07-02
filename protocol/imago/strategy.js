var util = require('util')
var Strategy = require('../strategy')
var Version = require('../../version')
var Cubelet = require('../../cubelet')
var Types = Cubelet.Types
var xtend = require('xtend/mutable')
var async = require('async')
var __ = require('underscore')

function ImagoStrategy(protocol, client) {
  Strategy.call(this, protocol, client)

  var messages = protocol.messages

  this.ping = function (callback, timeout) {
    client.echo(new Buffer(0), callback, timeout)
  }

  this.echo = function (data, callback, timeout) {
    client.sendRequest(new messages.EchoRequest(data), callback)
  }

  var configuration = null

  this.getConfiguration = function () {
    return configuration
  }

  this.fetchConfiguration = function (callback) {
    async.seq(
      client.sendRequest,
      onFetchConfiguration
    )(new messages.GetConfigurationRequest(), callback)
  }

  function onFetchConfiguration(response, callback) {
    var id = response.id
    blocks.upsert(id, 0, Types.BLUETOOTH)
    if (callback) {
      callback(null, response)
    }
  }

  var blocks = (function () {

    var self = this

    this.origin = null
    this.idMap = {}
    this.hopCountMap = { 0: [], 1: [], 2: [] }

    this.findById = function (id) {
      return __(this.idMap).find(function (cubelet, otherId) {
        return otherId === id
      })
    }

    this.filterByHopCount = function (hopCount) {
      return this.hopCountMap[hopCount] || []
    }

    this.upsert = function (id, hopCount, type) {
      var cubelet = exists(id)
      var updated = false
      if (cubelet) {
        if (hopCount !== cubelet.hopCount) {
          var fromHopCount = cubelet.hopCount
          moveRank(cubelet, hopCount)
          moved.push(cubelet)
          client.emit('moveBlock', cubelet, fromHopCount)
          updated = true
        }
      } else {
        cubelet = new Cubelet(id, type, hopCount)
        addId(cubelet)
        addRank(cubelet)
        client.emit('addBlock', cubelet)
        updated = true
      }
      if (updated) {
        client.emit('updateBlocks')
      }
      return cubelet
    }

    function exists(id) {
      return this.idMap[id]
    }

    function add(cubelet) {
      addId(cubelet)
      addRank(cubelet)
    }

    function remove(cubelet) {
      removeId(cubelet)
      removeRank(cubelet)
    }

    function addId(cubelet) {
      var id = cubelet.id
      this.idMap[id] = cubelet
    }

    function removeId(cubelet) {
      var id = cubelet.id
      if (id) {
        delete this.idMap[id]
      }
    }

    function getRank(hopCount) {
      var rank = this.hopCountMap[hopCount]
      if (!__(rank).isArray()) {
        rank = this.hopCountMap[hopCount] = []
      }
      return rank
    }

    function addRank(cubelet) {
      getRank(cubelet.hopCount).push(cubelet)
    }

    function removeRank(cubelet) {
      var rank = getRank(cubelet.hopCount)
      var i = __(rank).indexOf(cubelet)
      if (i > -1) {
        rank.splice(i, 1)
      }
    }

    function moveRank(cubelet, toHopCount) {
      if (toHopCount !== cubelet.hopCount) {
        removeRank(cubelet)
        cubelet.hopCount = toHopCount
        addRank(cubelet)
      }
    }

    return self
  })()

  this.fetchOriginBlock = function (callback) {
    client.fetchConfiguration(function (err) {
      if (callback) {
        callback(err, client.getOriginBlock())
      }
    })
  }

  this.getOriginBlock = function () {
    return blocks.origin
  }

  this.getNeighborBlocks = function () {
    return blocks.filterByHopCount(1)
  }

  this.fetchNeighborBlocks = function (callback) {
    async.seq(
      client.sendRequest,
      onFetchNeighborBlocks
    )(new messages.GetNeighborBlocksRequest(), callback)
  }

  function onFetchNeighborBlocks(response, callback) {
    response.blocks.forEach(function (block) {
      blocks.upsert(block.id, 1, Types.UNKNOWN)
    })
    if (callback) {
      callback(null, client.getNeighborBlocks())
    }
  }

  this.getAllBlocks = function () {
    return __(blocks.idMap).chain()
      .values()
      .sortBy(function (cubelet) {
        return cubelet.hopCount
      })
      .filter(function (cubelet) {
        return cubelet.hopCount > 0
      })
      .value()
  }

  this.fetchAllBlocks = function (callback) {
    async.seq(
      client.sendRequest,
      onFetchAllBlocks
    )(new messages.GetAllBlocksRequest(), callback)
  }

  function onFetchAllBlocks(response, callback) {
    response.blocks.forEach(function (block) {
      blocks.upsert(block.id, block.hopCount, Types.UNKNOWN)
    })
    if (callback) {
      callback(null, client.getAllBlocks())
    }
  }

  this.startBlockDiscovery = function (callback) {
    // TODO: start map updates
    async.series([
      client.fetchOriginBlock,
      client.fetchAllBlocks
    ], callback)
  }

  this.stopBlockDiscovery = function (callback) {
    // TODO: stop map updates
  }

  this.findBlockById = function (id) {
    return blocks.findById(id)
  }

  this.filterBlocksByHopCount = function (hopCount) {
    return blocks.filterByHopCount(hopCount)
  }

  this.setBlockValue = function (id, value, callback) {
    var block = { id: id, value: value }
    client.sendCommand(new messages.SetBlockValueCommand([ block ]), callback)
  }

  this.setManyBlockValues = function (blocks, callback) {
    client.sendCommand(new messages.SetBlockValueCommand(blocks), callback)
  }

  this.clearBlockValue = function (id, callback) {
    var block = { id: id }
    client.sendCommand(new messages.ClearBlockValueCommand([ block ]), callback)
  }

  this.clearManyBlockValues = function (blocks, callback) {
    client.sendCommand(new messages.ClearBlockValueCommand(blocks), callback)
  }

  this.clearAllBlockValues = function (callback) {
    throw new Error('not implemented')
  }

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

  this.uploadProgramToMemory = function (program, slot, callback) {
    var lineLength = 18
    var slotData = program.data
    var slotSize = Math.ceil(slotData.length / lineLength)
    var slotIndex = slot.index
    var blockType = slot.blockType
    var version = slot.version
    var isCustom = slot.isCustom
    var crc = slot.crc
    var request = new messages.UploadToMemoryRequest(slotIndex, slotSize, blockType, version, isCustom, crc)
    var timeout = slotSize * 1000 // 1 second per line?

    var timer = setTimeout(function () {
      client.removeListener('event', waitForCompleteEvent)
      if (callback) {
        callback(new Error('Timed out waiting for upload to complete.'))
      }
    }, timeout)

    function waitForCompleteEvent(e) {
      if (e instanceof messages.UploadToMemoryCompleteEvent) {
        clearTimeout(timer)
        client.removeListener('event', waitForCompleteEvent)
        if (callback) {
          callback(null)
        }
      }
    }

    client.on('event', waitForCompleteEvent)
    client.sendRequest(request, function (err) {
      if (err) {
        client.removeListener('event', waitForCompleteEvent)
        if (callback) {
          callback(err)
        }
      } else {
        client.sendData(slotData, function (err) {
          if (err) {
            client.removeListener('event', waitForCompleteEvent)
            if (callback) {
              callback(err)
            }
          }
        })
      }
    })
  }

  this.flashMemoryToBlock = function (id, slotIndex, callback) {
    var request = new messages.FlashMemoryToBlockRequest(id, slotIndex)
    client.sendRequest(request, function (err, response) {
      if (callback) {
        if (err) {
          callback(err)
        } else if (response.result !== 0) {
          callback(new Error('Flashing failed.'))
        } else {
          callback(null)
        }
      }
    })
  }

  this.flashProgramToBlock = function (program, block, callback) {
    var slot = {
      index: 0,
      blockType: block.type.id,
      version: new Version(0, 0, 0),
      isCustom: false,
      crc: 0xcc
    }
    client.uploadProgramToMemory(program, slot, function (err) {
      if (err) {
        if (callback) {
          callback(err)
        }
      } else {
        client.flashMemoryToBlock(block.id, slot.index, callback)
      }
    })
  }
}

util.inherits(ImagoStrategy, Strategy)
module.exports = ImagoStrategy
