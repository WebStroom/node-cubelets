var util = require('util');
var Command = require('../command');

var SetLEDColorCommand = function(color) {
  Command.call(this);
  this.code = 0x42;
  this.color = color;
};

util.inherits(SetLEDColorCommand, Command);

SetLEDColorCommand.prototype.encode = function() {
  return new Buffer([
    '<'.charCodeAt(0),
    this.code, 1,
    '>'.charCodeAt(0),
    this.color
  ]);
};

module.exports = SetLEDColorCommand;