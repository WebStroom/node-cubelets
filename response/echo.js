var util = require('util');
var Response = require('../response');

var EchoResponse = function(data, code) {
  this.echo = new Buffer(0);
  Response.call(this, data, code);
};

util.inherits(EchoResponse, Response);

EchoResponse.prototype.decode = function() {
  this.echo = this.data;
};

module.exports = EchoResponse;