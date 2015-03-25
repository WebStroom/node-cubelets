var util = require('util');
var Request = require('../request');

var SetLEDStateRequest = function(LEDState) {
  Request.call(this);
  this.code = 0x05;
  this.LEDState = LEDState;
};

util.inherits(SetLEDStateRequest, Request);

SetLEDStateRequest.prototype.encode = function() {
  return new Buffer([
    '<'.charCodeAt(0),
    this.code, 0, 1,
    '>'.charCodeAt(0),
    this.LEDState
  ]);
};

module.exports = SetLEDStateRequest;