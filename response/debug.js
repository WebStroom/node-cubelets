var util = require('util');
var Response = require('../response');

var DebugEvent = function(data, type) {
  Response.call(this, data, type);
};

util.inherits(DebugEvent, Response);

module.exports = DebugEvent;
