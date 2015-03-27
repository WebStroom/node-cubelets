var util = require('util');
var Response = require('../response');
var Decoder = require('../decoder');
var Version = require('../version');

var GetConfigurationResponse = function(data, code) {
  this.id = 0;
  this.hardwareVersion = new Version();
  this.bootloaderVersion = new Version();
  this.applicationVersion = new Version();
  this.hasCustomApplication = false;
  this.mode = -1;
  Response.call(this, data, code);
};

util.inherits(GetConfigurationResponse, Response);

GetConfigurationResponse.prototype.decode = function() {
  var data = this.data;

  if (data.length < 14) {
    console.error('Response should be at least 14 bytes but is', data.length, 'bytes.');
    return;
  }

  function readVersion(i) {
    return new Version(data[i], data[i + 1], data[i + 2]);
  }
  
  this.hardwareVersion = readVersion(0);
  this.bootloaderVersion = readVersion(3);
  this.applicationVersion = readVersion(6);
  this.id = Decoder.decodeID(data.slice(9, 3));
  this.mode = data.readUInt8(12);
  this.hasCustomApplication = data.readUInt8(13) ? true : false;
};

module.exports = GetConfigurationResponse;