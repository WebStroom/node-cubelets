var util = require('util');
var Response = require('../response');
var Decoder = require('../decoder');
var Version = require('../version');

var GetConfigurationResponse = function(data, code) {
  this.cubeletID = 0;
  this.hardwareVersion = new Version();
  this.bootloaderVersion = new Version();
  this.applicationVersion = new Version();
  this.hasCustomApplication = false;
  this.mode = -1;
  Response.call(this, data, code);
};

util.inherits(GetConfigurationResponse, Response);

GetConfigurationResponse.prototype.decode = function() {
  if (this.data.length < 14) {
    console.error('Response should be at least 14 bytes but is', this.data.length, 'bytes.');
    return;
  }

  var data = this.data;

  function readVersion(i) {
    return new Version(data[i], data[i + 1], data[i + 2]);
  }
  
  this.hardwareVersion = readVersion(0);
  this.bootloaderVersion = readVersion(3);
  this.applicationVersion = readVersion(6);
  this.cubeletID = Decoder.decodeID(data.slice(9, 3));
  this.mode = data.readUInt8(12);
  this.hasCustomApplication = data.readUInt8(13) ? true : false;
};

module.exports = GetConfigurationResponse;