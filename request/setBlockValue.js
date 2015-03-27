var util = require('util');
var Request = require('../request');
var Encoder = require('../encoder');

var SetBlockValueCommand = function(id, value) {
  Request.call(this);
  this.code = 0x41;
  this.id = id;
  this.value = value;
};

util.inherits(SetBlockValueCommand, Request);

SetBlockValueCommand.prototype.encode = function() {
  var encodedID = Encoder.encodeID(this.id);
  return new Buffer([
    '<'.charCodeAt(0),
    this.code, 4,
    '>'.charCodeAt(0),
    encodedID.readUInt8(0),
    encodedID.readUInt8(1),
    encodedID.readUInt8(2),
    this.value
  ]);
};

module.exports = SetBlockValueCommand;
