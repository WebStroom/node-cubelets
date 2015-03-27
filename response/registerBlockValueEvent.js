var util = require('util');
var Response = require('../response');

var RegisterBlockValueEventResponse = function(data, code) {
  this.enabled = false;
  Response.call(this, data, code);
};

util.inherits(RegisterBlockValueEventResponse, Response);

RegisterBlockValueEventResponse.prototype.decode = function() {
  var data = this.data;

  if (data.length != 1) {
    console.error('Response should be 1 byte but is', data.length, 'bytes.');
    return;
  }

  this.enabled = data.readUInt8(0) ? true : false;
};

module.exports = RegisterBlockValueEventResponse;