var util = require('util');
var Request = require('../request');

var GetConfigurationRequest = function() {
  Request.call(this);
  this.code = 0x01;
};

util.inherits(GetConfigurationRequest, Request);

GetConfigurationRequest.prototype.encode = function() {
  return new Buffer([
    '<'.charCodeAt(0),
    this.code, 0,
    '>'.charCodeAt(0)
  ]);
};

module.exports = GetConfigurationRequest;
