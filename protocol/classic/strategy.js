var util = require('util')
var Strategy = require('../../strategy')

function ClassicStrategy(protocol, client) {
  Strategy.call(this, protocol, client)

  this.sendRequest = function (request, callback, timeout) {
    Strategy.sendRequest.call(this, request, callack, timeout)
  }

}

util.inherits(ClassicStrategy, Strategy)
module.exports = ClassicStrategy
