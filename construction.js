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

  this.origin = function () {
    return origin
  }

  this.neighborhood = function () {
    return __(mapHopCount).chain().values().sortBy(function (cubelet, hopCount) {
      return hopCount
    }).value()
  }

  this.neighbors = function () {
    var neighbors = []
    return __(mapHopCount).reduce(function (cubelet, hopCount) {
      var hopCount = parseInt(hopCount)
      if (1 === hopCount) {
        neighbors.push(cubelet)
      }
    }, neighbors)
  }

  this.edges = function () {
    return edges
  }

  this.mapHopCount = function () {
    return mapHopCount
  }

  this.discover = function (callback) {
    connection.sendRequest(new messages.GetConfigurationRequest(), function (err, response) {
      if (err) {
        if (callback) {
          callback(err)
        }
      } else {
        onGetConfiguration(response)
        connection.sendRequest(new messages.GetNeighborhoodRequest(), function (err, response) {
          if (err) {
            if (callback) {
              callback(err)
            }
          } else {
            onGetNeighborhood(response)
            if (callback) {
              callback(null)
            }
          }
        })
      }
    })
  }

  function exists(id) {
    return mapId[id]
  }

  function upsert(id, hopCount, type) {
    var cubelet = exists(id)
    var added = []
    var removed = []
    var changed = false
    if (cubelet) {
      var rank = mapHopCount[hopCount]
      if (!__(rank).isArray()) {
        rank = [cubelet]
        changed = true
      } else {
        // check for duplicates (no double entry)
        var dupelet = __(rank).find(function (d) {
          hopCount === d.hopCount
        })
        if (!dupelet) {
          //TODO: check pre-existing hop counts to remove/replace
          rank.push(cubelet)
          added.push(cubelet)
          construction.emit('add', cubelet)
          changed = true
        } else {
          dupelet.xtend(cubelet)
          cubelet = dupelet
          changed = true //XXX: too paranoid - only if xtend'ed
        }
      }
    } else {
      cubelet = new Cubelet(id, type, hopCount)
      mapId[id] = cubelet
      var rank = mapHopCount[hopCount]
      if (!__(rank).isArray()) {
        rank = [cubelet]
      } else {
        rank.push(cubelet)
      }
      added.push(cubelet)
      construction.emit('add', cubelet)
      changed = true
    }
    if (changed) {
      construction.emit('change', added, removed)
    }
    return cubelet
  }

  function onGetConfiguration(response) {
    var id = response.id
    origin = upsert(id, 0, Types.BLUETOOTH)
    construction.emit('origin', construction.origin())
  }

  function onGetNeighborhood(response) {
    response.neighbors.forEach(function (neighbor) {
      upsert(neighbor.id, neighbor.hopCount, Types.UNKNOWN)
    })
    construction.emit('neighborhood', construction.neighborhood())
  }

  function onVisitNeighbor(response) {
    //TODO
  }

  return this
}

util.inherits(Construction, events.EventEmitter)
module.exports = Construction
