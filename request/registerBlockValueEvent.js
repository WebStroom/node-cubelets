var util = require('util');
var Request = require('../request');

var RegisterBlockValueEventRequest = function(enable) {
  Request.call(this);
  this.code = 0x05;
  this.enable = enable;
};

util.inherits(RegisterBlockValueEventRequest, Request);

RegisterBlockValueEventRequest.prototype.encode = function() {
  return new Buffer([
    '<'.charCodeAt(0),
    this.code, 1,
    '>'.charCodeAt(0),
    this.enable ? 0x01 : 0x00
  ]);
};

module.exports = RegisterBlockValueEventRequest;
