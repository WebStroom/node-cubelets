var util = require('util')
var Strategy = require('../strategy')
var Version = require('../../version')
var Cubelet = require('../../cubelet')
var Blocks = require('../../blocks')
var BlockTypes = Cubelet.BlockTypes
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

  var blocks = new Blocks()

  blocks.on('updateBlocks', function () {
    client.emit('updateBlocks')
  })

  function onFetchConfiguration(response, callback) {
    var blockId = response.blockId
    configuration = response
    blocks.setOrigin(blockId, BlockTypes.BLUETOOTH)
    if (callback) {
      callback(null, configuration)
    }
  }

  this.getOriginBlock = function () {
    return blocks.getOrigin()
  }

  this.fetchOriginBlock = function (callback) {
    client.fetchConfiguration(function (err) {
      if (callback) {
        callback(err, client.getOriginBlock())
      }
    })
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
    var origin = blocks.getOrigin()
    if (origin) {
      blocks.upsert({
        blockId: origin.blockId,
        neighbors: response.neighbors
      })
    }
    if (callback) {
      callback(null, client.getNeighborBlocks())
    }
  }

  this.getAllBlocks = function () {
    return blocks.getAll()
  }

  this.fetchAllBlocks = function (callback) {
    async.seq(
      client.sendRequest,
      onFetchAllBlocks
    )(new messages.GetAllBlocksRequest(), callback)
  }

  function onFetchAllBlocks(response, callback) {
    response.blocks.forEach(function (block) {
      blocks.upsert({
        blockId: block.blockId,
        hopCount: block.hopCount,
        blockType: BlockTypes.UNKNOWN
      })
    })
    if (callback) {
      callback(null, client.getAllBlocks())
    }
  }

  this.getGraph = function () {
    return blocks.getGraph()
  }

  this.fetchGraph = function (callback) {
    async.series([
      client.fetchOriginBlock,
      client.fetchAllBlocks,
      client.fetchAllBlockConfigurations,
      client.fetchNeighborBlocks,
      client.fetchAllBlockNeighbors
    ], callback)
  }

  function sortBlocksByHopCount(unsortedBlocks) {
    return __(unsortedBlocks).sortBy(function (block) {
      return typeof block.hopCount === 'number' ? block.hopCount : 255
    })
  }

  this.fetchAllBlockConfigurations = function (callback) {
    client.fetchBlockConfigurations(client.getAllBlocks(), callback)
  }

  this.fetchBlockConfigurations = function (unsortedBlocks, callback) {
    var fetchTasks = []
    __(sortBlocksByHopCount(unsortedBlocks)).each(function (block) {
      fetchTasks.push(function (callback) {
        var blockId = block.blockId
        var GetConfigurationRequest = protocol.Block.messages.GetConfigurationRequest
        client.sendBlockRequest(new GetConfigurationRequest(blockId), function (err, response) {
          if (err) {
            if (callback) {
              callback(err)
            }
          } else {
            blocks.upsert({
              blockId: blockId,
              blockType: Cubelet.typeForTypeId(response.blockTypeId),
              hardwareVersion: response.hardwareVersion,
              bootloaderVersion: response.bootloaderVersion,
              applicationVersion: response.applicationVersion,
              customApplication: response.customApplication,
              mode: response.mode
            })
            if (callback) {
              callback(null)
            }
          }
        })
      })
    })
    async.series(fetchTasks, callback)
  }

  this.fetchAllBlockNeighbors = function (callback) {
    client.fetchBlockNeighbors(client.getAllBlocks(), callback)
  }

  this.fetchBlockNeighbors = function (unsortedBlocks, callback) {
    var fetchTasks = []
    __(sortBlocksByHopCount(unsortedBlocks)).each(function (block) {
      fetchTasks.push(function (callback) {
        var blockId = block.blockId
        var GetNeighborsRequest = protocol.Block.messages.GetNeighborsRequest
        client.sendBlockRequest(new GetNeighborsRequest(blockId), function (err, response) {
          if (err) {
            if (callback) {
              callback(err)
            }
          } else {
            blocks.upsert({
              blockId: blockId,
              neighbors: response.neighbors
            })
            if (callback) {
              callback(null)
            }
          }
        })
      })
    })
    async.series(fetchTasks, callback)
  }

  this.findBlockById = function (blockId) {
    return blocks.findById(blockId)
  }

  this.filterBlocksByHopCount = function (hopCount) {
    return blocks.filterByHopCount(hopCount)
  }

  this.setBlockValue = function (blockId, value, callback) {
    var block = { blockId: blockId, value: value }
    client.sendCommand(new messages.SetBlockValueCommand([ block ]), callback)
  }

  this.setManyBlockValues = function (blocks, callback) {
    client.sendCommand(new messages.SetBlockValueCommand(blocks), callback)
  }

  this.clearBlockValue = function (blockId, callback) {
    var block = { blockId: blockId }
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
        callback(new Error('Timed out waiting for block response to block request: ' + blockRequest.code()))
      }
    }, timeout)

    function waitForBlockResponse(e) {
      if (e.code() === messages.ReadBlockMessageEvent.code) {
        var blockResponse = e.blockMessage
        if (protocol.Block.requestCodeForResponseCode(blockResponse.code()) === blockRequest.code() && blockResponse.blockId === blockRequest.blockId) {
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

  this.flashMemoryToBlock = function (blockId, slotIndex, callback) {
    var request = new messages.FlashMemoryToBlockRequest(blockId, slotIndex)
    client.sendRequest(request, function (err, response) {
      if (callback) {
        if (err) {
          if (callback) {
            callback(err)
          }
        } else if (response.result !== 0) {
          if (callback) {
            callback(new Error('Flashing failed.'))
          }
        } else {
          if (callback) {
            callback(null)
          }
        }
      }
    })
  }

  this.flashProgramToBlock = function (program, block, callback) {
    var slot = {
      index: 0,
      blockTypeId: block.type.typeId,
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
        client.flashMemoryToBlock(block.blockId, slot.index, callback)
      }
    })
  }
}

util.inherits(ImagoStrategy, Strategy)
module.exports = ImagoStrategy
