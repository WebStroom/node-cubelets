var util = require('util');
var events = require('events');
var Cubelet = require('./cubelet')
var Types = Cubelet.Types
var messages = require('./protocol/imago').messages
var xtend = require('xtend/mutable')
var __ = require('underscore')

var Construction = function (connection) {
  events.EventEmitter.call(this)

  var origin = null
  var mapId = {}
  var mapHopCount = { 0: [], 1: [], 2: [] }
  var edges = []
  var construction = this

  this.getOrigin = function () {
    return origin
  }

  this.getAllBlocks = function () {
    var all = __(mapId).values()
    return __(all).chain()
      .sortBy(function (cubelet) {
        return cubelet.hopCount
      })
      .filter(function (cubelet) {
        return cubelet.hopCount > 0 // omit origin
      })
      .value()
  }

  this.getNeighborBlocks = function () {
    return this.filterByHopCount(1)
  }

  this.getEdges = function () {
    return edges
  }

  this.findById = function (id) {
    return __(mapId).find(function (cubelet, keyId) {
      return keyId === id
    })
  }

  this.filterByHopCount = function (hopCount) {
    return mapHopCount[hopCount] || []
  }

  this.discover = function (callback) {
    connection.sendRequest(new messages.GetConfigurationRequest(), function (err, response) {
      if (err) {
        if (callback) {
          callback(err)
        }
      } else {
        onGetConfiguration(response)
        connection.sendRequest(new messages.GetAllBlocksRequest(), function (err, response) {
          if (err) {
            if (callback) {
              callback(err)
            }
          } else {
            onGetAllBlocks(response)
            if (callback) {
              callback(null)
            }
          }
        })
      }
    })
  }

  function onGetConfiguration(response) {
    var id = response.id
    origin = upsert(id, 0, Types.BLUETOOTH)
  }

  function onGetAllBlocks(response) {
    response.blocks.forEach(function (block) {
      upsert(block.id, block.hopCount, Types.UNKNOWN)
    })
  }

  function onVisitBlock(response) {

  }

  function upsert(id, hopCount, type) {
    var cubelet = exists(id)
    var added = []
    var removed = []
    var moved = []
    var changed = false
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
        construction.emit('move', cubelet, fromHopCount)
        changed = true
      }
    } else {
      cubelet = new Cubelet(id, type, hopCount)
      addId(cubelet)
      addRank(cubelet)
      added.push(cubelet)
      construction.emit('add', cubelet)
      changed = true
    }
    if (changed) {
      construction.emit('update')
    }
    return cubelet
  }

  function exists(id) {
    return mapId[id]
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
    mapId[id] = cubelet
  }

  function removeId(cubelet) {
    var id = cubelet.id
    if (id) {
      delete mapId[id]
    }
  }

  function getRank(hopCount) {
    var rank = mapHopCount[hopCount]
    if (!__(rank).isArray()) {
      rank = mapHopCount[hopCount] = []
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
}

util.inherits(Construction, events.EventEmitter)
module.exports = Construction
