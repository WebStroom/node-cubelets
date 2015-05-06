var Types = require('./config.json')['types']
var __ = require('underscore')

var Cubelet = function (id, type, hopCount, mcu) {
  this.id = id
  this.type = type || Types.UNKNOWN
  this.hopCount = hopCount
  this.mcu = mcu
}

module.exports = Cubelet
module.exports.Types = Types

module.exports.typeForTypeID = function(typeID) {
  return __(Types).find(function(type) {
    return type.id == typeID
  }) || Types.UNKNOWN
}
