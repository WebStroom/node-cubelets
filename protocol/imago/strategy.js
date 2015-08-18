var util = require('util')
var Strategy = require('../strategy')
var Version = require('../../version')
var Block = require('../../block')
var BlockMap = require('../../blockMap')
var BlockTypes = require('../../blockTypes')
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

  var map = new BlockMap()

  map.on('update', function () {
    client.emit('updateBlockMap')
  })

  this.getBlockMap = function () {
    return map
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
    var blockId = response.blockId
    configuration = response
    map.setOriginBlock(blockId, BlockTypes.BLUETOOTH)
    if (callback) {
      callback(null, configuration)
    }
  }

  this.fetchOriginBlock = function (callback) {
    client.fetchConfiguration(function (err) {
      if (callback) {
        callback(err, map.getOriginBlock())
      }
    })
  }

  this.fetchNeighborBlocks = function (callback) {
    async.seq(
      client.sendRequest,
      onFetchNeighborBlocks
    )(new messages.GetNeighborBlocksRequest(), callback)
  }

  function onFetchNeighborBlocks(response, callback) {
    var origin = map.getOriginBlock()
    if (origin) {
      map.upsert({
        blockId: origin.getBlockId(),
        neighbors: response.neighbors
      })
    }
    __(response.neighbors).each(function (blockId, faceIndex) {
      map.upsert({
        blockId: blockId,
        hopCount: 1
      })
    })
    if (callback) {
      callback(null, map.getNeighborBlocks())
    }
  }

  this.fetchAllBlocks = function (callback) {
    async.seq(
      client.sendRequest,
      onFetchAllBlocks
    )(new messages.GetAllBlocksRequest(), callback)
  }

  function onFetchAllBlocks(response, callback) {
    response.blocks.forEach(function (block) {
      map.upsert({
        blockId: block.blockId,
        hopCount: block.hopCount
      })
    })
    if (callback) {
      callback(null, map.getAllBlocks())
    }
  }

  this.fetchGraph = function (callback) {
    async.series([
      client.fetchOriginBlock,
      client.fetchAllBlocks,
      client.fetchNeighborBlocks,
      fetchBlockConfigurations,
      fetchBlockNeighbors
    ], function (err) {
      if (callback) {
        if (err) {
          callback(err)
        } else {
          callback(null, map.getGraph())
        }
      }
    })
  }

  function sortBlocksByHopCount(unsortedBlocks) {
    return __(unsortedBlocks).sortBy(function (block) {
      return typeof block.hopCount === 'number' ? block.hopCount : 255
    })
  }

  function fetchBlockConfigurations(callback) {
    queueGetConfigurationBlockRequests(map.getAllBlocks(), callback)
  }

  function queueGetConfigurationBlockRequests(unsortedBlocks, callback) {
    var fetchTasks = []
    __(sortBlocksByHopCount(unsortedBlocks)).each(function (block) {
      fetchTasks.push(function (callback) {
        var blockId = block.getBlockId()
        var GetConfigurationRequest = protocol.Block.messages.GetConfigurationRequest
        client.sendBlockRequest(new GetConfigurationRequest(blockId), function (err, response) {
          if (err) {
            if (callback) {
              callback(err)
            }
          } else {
            map.upsert({
              blockId: blockId,
              blockType: Block.typeForTypeId(response.blockTypeId),
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

  function fetchBlockNeighbors(callback) {
    queueGetNeighborsBlockRequests(map.getAllBlocks(), callback)
  }

  function queueGetNeighborsBlockRequests(unsortedBlocks, callback) {
    var fetchTasks = []
    __(sortBlocksByHopCount(unsortedBlocks)).each(function (block) {
      fetchTasks.push(function (callback) {
        var blockId = block.getBlockId()
        var GetNeighborsRequest = protocol.Block.messages.GetNeighborsRequest
        client.sendBlockRequest(new GetNeighborsRequest(blockId), function (err, response) {
          if (err) {
            if (callback) {
              callback(err)
            }
          } else {
            map.upsert({
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

  this.setBlockValue = function (blockId, value) {
    var block = map.findById(blockId)
    if (block) {
      block._value = value
      block._valueOverridden = true
      client.sendCommand(new messages.SetBlockValueCommand([{
        blockId: blockId,
        value: value
      }]))
    } else {
      client.emit('error', new Error('Block not found.'))
    }
  }

  this.setManyBlockValues = function (blockValueMap) {
    var blocks = __(blockValueMap).reduce(function (blocks, blockId, value) {
      var block = map.findById(blockId)
      if (block) {
        block._value = value
        blocks.push({
          blockId: blockId,
          value: value
        })
      } else {
        client.emit('error', new Error('Block not found.'))
      }
    }, [])
    if (blocks.length > 0) {
      client.sendCommand(new messages.SetBlockValueCommand(blocks))
    }
  }

  this.clearBlockValue = function (blockId) {
    var block = map.findById(blockId)
    if (block) {
      block._valueOverridden = false
      client.sendCommand(new messages.ClearBlockValueCommand([{
        blockId: blockId
      }]))
    } else {
      client.emit('error', new Error('Block not found.'))
    }
  }

  this.clearManyBlockValues = function (blocks, callback) {
    var blocks = __(blockValueMap).reduce(function (blocks, blockId, value) {
      var block = map.findById(blockId)
      if (block) {
        block._valueOverridden = value
        blocks.push({
          blockId: blockId
        })
      } else {
        client.emit('error', new Error('Block not found.'))
      }
    }, [])
    if (blocks.length > 0) {
      client.sendCommand(new messages.ClearBlockValueCommand(blocks))
    }
  }

  this.clearAllBlockValues = function (callback) {
    var blocks = __(map.getBlocks()).filter(function (block) {
      return block.isValueOverridden()
    })
    if (blocks.length > 0) {
      client.clearManyBlockValues(blocks, callback)
    }
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
        client.flashMemoryToBlock(block.getBlockId(), slot.index, callback)
      }
    })
  }
}

util.inherits(ImagoStrategy, Strategy)
module.exports = ImagoStrategy
