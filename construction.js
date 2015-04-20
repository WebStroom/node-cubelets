var util = require('util');
var events = require('events');
var Cubelet = require('./cubelet')
var Types = Cubelet.Types
var GetNeighborhoodRequest = require('./request/getNeighborhood')
var VisitNeighborRequest = require('./request/visitNeighbor')
var GetNeighborhoodResponse = require('./response/getNeighborhood')
var VisitNeighborResponse = require('./response/visitNeighbor')
var __ = require('underscore')
var xtend = require('xtend/mutable')

var Construction = function (connection) {
  events.EventEmitter.call(this)

  var origin = null
  var mapId = {}
  var mapHopCount = { 0: [], 1: [], 2: [] }
  var edges = []
  var construction = this

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
    // Update origin
    var id = response.id
    var origin = upsert(id, 0, Types.BLUETOOTH)
    construction.origin = origin
  }

  function onGetNeighborhood(response) {
    var nextNeighborhood = response.neighbors
    nextNeighborhood.forEach(function (neighbor) {
      upsert(neighbor.id, neighbor.hopCount, Types.UNKNOWN)
    })
  }

  function onVisitNeighbor(response) {
    //TODO
  }

  this.origin = function () {
    return origin
  }

  this.neighborhood = function () {
    return Object.values(mapHopcount)
  }

  this.neighbors = function () {
    var neighbors = []
    return __(mapHopcount).reduce(function (cubelet, hopCount) {
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
    return mapHopcount
  }

  this.discover = function (callback) {
    connection.sendRequest(new cubelets.GetConfigurationRequest(), function (err, response) {
      if (err) {
        if (callback) {
          callback(err)
        }
      } else {
        onGetConfiguration(response)
        connection.sendRequest(new cubelets.GetNeighborhoodRequest(), function (err, response) {
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

}

util.inherits(Construction, events.EventEmitter)
module.exports = Construction
