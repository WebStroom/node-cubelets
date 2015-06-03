var util = require('util')
var Strategy = require('../../strategy')
var Cubelet = require('../../cubelet')
var Types = Cubelet.Types
var xtend = require('xtend/mutable')
var async = require('async')
var __ = require('underscore')

function ImagoStrategy(protocol, client) {
  Strategy.call(this, protocol, client)

  var messages = protocol.messages

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

  this.keepAlive = function (callback) {
    client.echo(new Buffer(0), callback)
  }

  this.echo = function (data, callback) {
    client.sendRequest(new messages.EchoRequest(data), callback)
  }

  var configuration = null

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

  this.getConfiguration = function () {
    return configuration
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
      var added = []
      var removed = []
      var moved = []
      var updated = false
      if (cubelet) {
        var rank = getRank(hopCount)
        var dupe = __(rank).find(function (d) {
          return d.hopCount === hopCount
        })
        if (dupe) {
          cubelet = dupe
        } else if (cubelet.hopCount !== hopCount) {
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
        added.push(cubelet)
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
      var hopCount = cubelet.hopCount
      var rank = getRank(hopCount)
      rank.push(cubelet)
    }

    function removeRank(cubelet) {
      var hopCount = cubelet.hopCount
      var rank = getRank(hopCount)
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

  this.fetchNeighborBlocks = function (callback) {
    async.seq(
      client.sendRequest,
      onFetchNeighborBlocks
    )(new messages.GetNeighborBlocksRequest(), callback)
  }

  function onFetchBlocks(b) {
    if (b) {
      b.forEach(function (block) {
        blocks.upsert(block.id, block.hopCount, Types.UNKNOWN)
      })
    }    
  }

  function onFetchNeighborBlocks(response, callback) {
    onFetchBlocks(response.blocks)
    if (callback) {
      callback(null, client.getNeighborBlocks())
    }
  }

  this.getNeighborBlocks = function () {
    return blocks.filterByHopCount(1)
  }

  this.fetchAllBlocks = function (callback) {
    async.seq(
      client.sendRequest,
      onFetchAllBlocks
    )(new messages.GetAllBlocksRequest(), callback)
  }

  function onFetchAllBlocks(response, callback) {
    onFetchBlocks(response.blocks)
    if (callback) {
      callback(null, client.getAllBlocks())
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

  this.setBlockValueEventEnabled = function (enabled, callback) {
    client.sendRequest(new messages.RegisterBlockValueEventRequest(enabled), callback)
  }
}

util.inherits(ImagoStrategy, Strategy)
module.exports = ImagoStrategy
