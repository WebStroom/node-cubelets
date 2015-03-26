var util = require('util');
var Request = require('../request');

var EchoRequest = function(echo) {
  Request.call(this);
  this.code = 0x20;
  this.echo = echo;
};

util.inherits(EchoRequest, Request);

EchoRequest.prototype.encode = function() {
  return Buffer.concat([
    new Buffer([
      '<'.charCodeAt(0),
      this.code, this.echo.length,
      '>'.charCodeAt(0)
    ]),
    this.echo
  ]);
};

module.exports = EchoRequest;
