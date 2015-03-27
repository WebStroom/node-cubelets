var util = require('util');
var Request = require('../request');
var Encoder = require('../encoder');

var GetBlockValueRequest = function(id) {
  Request.call(this);
  this.code = 0x04;
  this.id = id;
};

util.inherits(GetBlockValueRequest, Request);

GetBlockValueRequest.prototype.encode = function() {
  var encodedID = Encoder.encodeID(this.id);
  return new Buffer([
    '<'.charCodeAt(0),
    this.code, 3,
    '>'.charCodeAt(0),
    encodedID.readUInt8(0),
    encodedID.readUInt8(1),
    encodedID.readUInt8(2)
  ]);
};

module.exports = GetBlockValueRequest;
