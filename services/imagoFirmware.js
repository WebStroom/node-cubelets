var debug = require('debug')('cubelets:firmwareService')
var util = require('util')
var request = require('request')
var config = require('../config.json')
var http = require('http');
var Version = require('../version.js')

function ImagoFirmwareService() {
  var info = {}
  var baseUrl = config['urls']['imagoFirmware']
  var service = this
  
  this.checkForUpdate = function(block, callback)
  {
  	if(!block || !block.getBlockType() || block.getBlockType().name == "unknown")
  	{
  		callback(new Error("Invalid block type provided"))
  		return
  	}
  	else if(!block.getHardwareVersion() || !block.getBootloaderVersion() || !block.getApplicationVersion())
  	{
  		callback(new Error("Invalid versions provided"))
  		return;
  	}  	
  	  	
  	var options = {
		  host: baseUrl,
		  path: '/firmware?' + [
		    'platform=cubelets',
		    'product=cubelet-'+block.getBlockType().name,
		    'hardwareVersion=' + block.getHardwareVersion().toString(),
		    'bootloaderVersion=' + block.getBootloaderVersion().toString(),
		    'applicationVersion=' + block.getApplicationVersion().toString()
		  ].join('&')
		};

		http.get(options, function(res) {
			var body = '';
			res.on('data', function(chunk) {
				body += chunk;
			});
			res.on('end', function() {
				try {
					var json = JSON.parse(body);
					callback(null, json)
				} catch (e) {
					callback(e)
				}
			});
		});
  }
  
  this.fetchLatestHex = function(block, callback)
  {
  	block._applicationVersion = new Version(0, 0, 0)
  	this.checkForUpdate(block, callback)
  }
}

module.exports = ImagoFirmwareService
