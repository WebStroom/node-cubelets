var util = require('util');
var Response = require('../response');
var Decoder = require('../decoder');

var GetRoutingTableResponse = function(data, code) {
  this.ids = [];
  Response.call(this, data, code);
};

util.inherits(GetRoutingTableResponse, Response);

GetRoutingTableResponse.prototype.decode = function() {
  var data = this.data;

  if (data.length % 3 != 0) {
    console.error('Response length should be divisible by 3.');
    return;
  }

  var count = data.length / 3;
  for (var i = 0; i < count; ++i) {
    var id = Decoder.decodeID(data.slice(i * 3, i * 3 + 3));
    this.ids.push(id);
  }
};

module.exports = GetRoutingTableResponse;