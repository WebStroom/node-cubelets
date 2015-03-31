var util = require('util');
var Response = require('../response');
var Decoder = require('../decoder');

var BlockValueEvent = function(data, code) {
  this.id = 0;
  this.value = -1;
  Response.call(this, data, code);
};

util.inherits(BlockValueEvent, Response);

BlockValueEvent.prototype.decode = function() {
  var data = this.data;

  if (data.length != 4) {
    console.error('Response should be 4 bytes but is', data.length, 'bytes.');
    return;
  }

  function readVersion(i) {
    return new Version(data[i], data[i + 1], data[i + 2]);
  }
  
  this.id = Decoder.decodeID(data.slice(0, 3));
  this.value = data.readUInt8(3);
};

module.exports = BlockValueEvent;