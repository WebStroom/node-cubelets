var util = require('util');
var Message = require('./message');

var Request = function() {
  Message.call(this);
};

util.inherits(Request, Message);

Request.prototype.encode = function() {
  return new Buffer(0);
};

module.exports = Request;