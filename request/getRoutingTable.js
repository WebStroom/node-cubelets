var util = require('util');
var Request = require('../request');

var GetRoutingTableRequest = function() {
  Request.call(this);
  this.code = 0x10;
};

util.inherits(GetRoutingTableRequest, Request);

GetRoutingTableRequest.prototype.encode = function() {
  return new Buffer([
    '<'.charCodeAt(0),
    this.code, 0,
    '>'.charCodeAt(0)
  ]);
};

module.exports = GetRoutingTableRequest;
