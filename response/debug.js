var util = require('util');
var Response = require('../response');

var DebugEvent = function(data, type) {
  this.messagesReceived = 0;
  this.spaceAvailable = 0;
  Response.call(this, data, type);
};

util.inherits(DebugEvent, Response);

DebugEvent.prototype.decode = function() {
  var data = this.data;

  if (data.length != 2) {
    console.error('Response should be 2 bytes but is', data.length, 'bytes.');
    return;
  }

  this.messagesReceived = data.readUInt8(0);
  this.spaceAvailable = data.readUInt8(1);
};

module.exports = DebugEvent;
