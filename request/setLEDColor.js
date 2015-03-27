var util = require('util');
var Request = require('../request');

var SetLEDColorCommand = function(color) {
  Request.call(this);
  this.code = 0x42;
  this.color = color;
};

util.inherits(SetLEDColorCommand, Request);

SetLEDColorCommand.prototype.encode = function() {
  return new Buffer([
    '<'.charCodeAt(0),
    this.code, 1,
    '>'.charCodeAt(0),
    this.color
  ]);
};

module.exports = SetLEDColorCommand;