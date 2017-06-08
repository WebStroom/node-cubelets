var debug = require('debug')('cubelets:btle')
var util = require('util')
var Scanner = require('../scanner')
var Connection = require('../connection')
var Client = require('../client')
var xtend = require('xtend')

//TODO: Add a generic error handler, all errors seem to report the same information.


//Nordic UART UUIDs
var SERVICE_UUID =  '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
var RX_UUID =       '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
//This is the characteristic we should receive data on. Perhaps switch
var TX_UUID =       '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';

var IOS_DELAY_BETWEEN_WRITES = 5;
var ANDROID_DELAY_BETWEEN_WRITES = 0;

var BTLEScanner = function (opts) {
  Scanner.call(this)
  var scanner = this;

  this._getDevices = function (callback) {
    //TODO: check bluetoothle.isInitialized(isInitialized);
      //If not: initialize

    var devices = [];
    function retrieveConnectedSuccess(devices){
      callback(null, devices);
    }
    function retrieveConnectedError(e){
      callback(e);
    }
    bluetoothle.retrieveConnected(retrieveConnectedSuccess, retrieveConnectedError, {
      "services": [
        SERVICE_UUID
      ]
    });
  }

  // Add a discovery method that can call a callback repeatedly with RSSi updates
  this._startScan = function(deviceAddedCallback, deviceUpdatedCallback, callback){
    //TODO: Windows forces you to pair
    if (window.cordova.platformId === "windows") {
      bluetoothle.retrieveConnected(retrieveConnectedSuccess, handleError, {});
    }

    //Scanning Callbacks
    var beginScan = function(){
      bluetoothle.startScan(scanReturn, scanError, params);
    }
    var scanReturn = function(result){
      if(result.status == "scanStarted"){
        callback(null);
      }
      else if(result.status == "scanResult"){
        if(result.name && (result.name.toLowerCase().indexOf('cubelet') === 0 || result.name.toLowerCase().indexOf('nordic_uart') >= 0)){
          result.btType = 'le';
          if(scanner._add(result)){
            //New Device
            deviceAddedCallback(result);
          }
          else{
            //Updated Device
            deviceUpdatedCallback(result);
          }
        }
      }
    }
    var scanError = function(e){
      callback(e);
    }
    if(scanner._scanning){
      scanner.stopDeviceScan(beginScan);
    }
    else{
      beginScan();
    }

    var params = {
      "services": [
      ],
      "allowDuplicates": true,
      "scanMode": bluetoothle.SCAN_MODE_LOW_LATENCY,
      "matchMode": bluetoothle.MATCH_MODE_AGGRESSIVE,
      "matchNum": bluetoothle.MATCH_NUM_MAX_ADVERTISEMENT,
      "callbackType": bluetoothle.CALLBACK_TYPE_ALL_MATCHES
    }
  }
  //Override of Scanner
  this.startDeviceScan = function (deviceAddedCallback, deviceUpdatedCallback, callback) {
    scanner._scanning = true
    scanner._startScan(deviceAddedCallback, deviceUpdatedCallback, callback);
  }
  this._stopScan = function(callback){
    bluetoothle.stopScan(function(){
        //Success Callback
        callback(null);
    }, function(e){
        //Error Callback
        callback(e);
    });
  }
  //Override of Sanner
  this.stopDeviceScan = function (callback) {
    scanner._scanning = false
    this._stopScan(callback);
  }

  this._compareDevice = function (device, otherDevice) {
    return device.address == otherDevice.address
  }
}

util.inherits(BTLEScanner, Scanner)


/*
BLE Central role:

initialize
scan (if device address is unknown)
connect
discover OR services/characteristics/descriptors (iOS)
read/subscribe/write characteristics AND read/write descriptors
disconnect
close
*/
var BTLEConnection = function (device, opts) {
  Connection.call(this, device, opts)

  var address = device['address'] || '00:00:00:00:00:00'
  var services = device['services']
  var channelID = (typeof device['channelID'] !== undefined) ?
    device.channelID : (Array.isArray(services) && services.length > 0) ?
      services[0].channelID : 1
  var stream = this;

  this._read = function (n) {
    // do nothing
  }

  this._write = function(data, enc, next){
    var chunkSize = 20;
    writeChunk(0);

    function writeChunk(i){
      var start = i * chunkSize;
      var end = start + chunkSize;
      var chunk = data.slice(start, end);

      if(chunk.length > 0){
        write(chunk, function(err){
          if(err){
            next(err);
          }
          else{
            setTimeout(function(){
              writeChunk(i+1);
            }, window.cordova.platformId.toLowerCase() == "ios" ? IOS_DELAY_BETWEEN_WRITES : ANDROID_DELAY_BETWEEN_WRITES);
          }
        })
      }
      else{
        next();
      }
    }

    function write(chunk, callback){
      var value = bluetoothle.bytesToEncodedString(chunk);
      bluetoothle.writeQ(function(d){
        debug("writeQ returned", d);
        callback(null);
      }, function(e){
        debug(e);
        if(e.error == "isNotConnected"){
          //TODO
          debug("STATUS DISCONNECTED: Caught in _write();")
        }
        callback(e);
      }, {
        value: value,
        address: address,
        characteristic: RX_UUID,
        service: SERVICE_UUID,
        type: "noResponse"
      });
    }

  }

  /*this._write = function (chunk, enc, next) {
    var value = bluetoothle.bytesToEncodedString(chunk);
    bluetoothle.writeQ(function(d){
      debug("writeQ returned", d);
      if(window.cordova.platformId.toLowerCase() == "ios"){
        setTimeout(function(){
          next(null, chunk.length);
        }, 0)//TODO! this is un-acceptable, find a better way.
      }
      else{
        next(null, chunk.length);
      }
    }, function(e){
      debug(e);
      if(e.error == "isNotConnected"){
        //TODO
        debug("STATUS DISCONNECTED: Caught in _write();")
      }
      next(e);
    }, {
      value: value,
      address: address,
      characteristic: RX_UUID,
      service: SERVICE_UUID,
      type: "noResponse"
    });
  }*/
  function toArrayBuffer(arr){
    var r = new Uint8Array(arr);
    return r.buffer;
  }

  this._open = function (callback) {
    //TODO: Check if we are/were already connected. Disconnect if so
    bluetoothle.connect(function(result){
      if(result.status == "disconnected"){
        //TODO: This case is not being handled correctly.
        debug("STATUS DISCONNECTED: Caught in callback to bluetoothle.connect();")
        stream.close(function(){});
        return;
      }
      else{
        debug("bluetoothle.connect callback")
        debug(result);
      }
      var platform = window.cordova.platformId.toLowerCase();
      if(platform == "android"){
        //Android:
          bluetoothle.requestConnectionPriority(function(){
            //Success
            // discover services/characteristics/descriptors and subscribe to the characteristic
            discoverAndroid(address, callback);
          }, function(){
            //Error
            // discover services/characteristics/descriptors and subscribe to the characteristic
            discoverAndroid(address, callback);
          }, {
            "address": address,
            "connectionPriority" : "high"
          });
      }
      else if(platform == "ios"){
        //Android style discovery is experimental on iOS. Problems reported on iOS8
        //discoveriOS(address, callback);
        discoverAndroid(address, callback);
      }
      else if(platform == "windows"){
        //TODO Go straight to services
        debug("Windows platform not implemented")
        //bluetoothle.services(resolve, reject, { address: address });
      }
      else{
        debug(platform+" platform not implemented")
      }
    }, function(e){
      //TODO: This seems like it is being called on disconnect
      debug("bluetoothle.connect error callback")
      debug(e);
      //TODO: Handle "Device previously connected, reconnect or close for new device"
      callback(new Error("Failed to connect."));
    }, { address: address, autoConnect: false });
  }

  this._close = function (callback) {
    debug("_close")
    function _disconnect(){
      bluetoothle.disconnect(_close, _close, {"address": address});
    }
    function _close(){
      bluetoothle.close(function(){callback(null);}, function(){callback(null);}, {"address": address});
    }
    _disconnect();
  }

  function discoverAndroid(address, callback){
    //if android
    bluetoothle.discover(function(result){
      //Success
      if(result.status == "discovered")
      {
        //For each of result.services find the service.uuid == SERVICE_UUID
        result.services.forEach(function(service) {
          if(service.uuid == SERVICE_UUID){
            //For each service.characteristics
            service.characteristics.forEach(function(characteristic){
              if(characteristic.uuid == TX_UUID){
                bluetoothle.subscribe(function(result){
                  if(result.status == "subscribed"){
                    //subscribe success
                    callback(null);
                  }
                  else if(result.status == "subscribedResult"){
                    //aka receive()
                    var bytes = bluetoothle.encodedStringToBytes(result.value);
                    var buf = new Buffer(bytes);
                    stream.push(buf);
                  }
                  else{
                    debug("unknown result");
                    debug(result);
                  }
                }, function(result){
                  //subscribe failure
                  debug("Subscribe error callback", result)
                  if(result.error === "isDisconnected"){

                  }
                  else{
                    callback(null);
                  }
                },{
                  "address": address,
                  "service": service.uuid,
                  "characteristic": characteristic.uuid,
                });
              }
            });
          }
        });
      }
    }, function(e){
      //Discover Failure
      debug("Discover failure");
      callback(e);
    }, { address: address });
  }

  //TODO
  function discoveriOS(address, callback){
    var servicesSuccess, servicesError, characteristicsSuccess, characteristicsError, descriptorsSuccess, descriptorsError, subscribeSuccess, subscribeError;
    //Callback handlers
    servicesSuccess = function(result){
      debug("Services success: ", result);
      //For each of the services, fetch the characteristics
      result.services.forEach(function(service) {
        bluetoothle.characteristics(characteristicsSuccess, characteristicsError, {
          "address": address,
          "service": service.uuid,
          "characteristics": []
        });
      });
    }
    servicesError = function(e){
      callback(e);
    }
    characteristicsSuccess = function(result){
      debug("Characteristics success: ", result);
      result.characteristics.forEach(function(characteristic) {
        if(characteristic.uuid == TX_UUID){
          bluetoothle.subscribe(subscribeSuccess, subscribeError, {
            "address": result.address,
            "service": result.service,
            "characteristic": characteristic.uuid,
          });
        }

        bluetoothle.descriptors(descriptorsSuccess, descriptorsError, {
          "address": address,
          "service": result.service,
          "characteristic": characteristic.uuid
        });
      });
    }
    characteristicsError = function(e){
      callback(e);
    }
    descriptorsSuccess = function(result){
      debug("Fetch descriptor success: ", result);
      /*

        result =
        {
          "status": "descriptors",
          "descriptors": [
            "2902"
          ],
          "characteristic": "2a37",
          "name": "Polar H7 3B321015",
          "service": "180d",
          "address": "ECC037FD-72AE-AFC5-9213-CA785B3B5C63"
        }

      */
    }
    descriptorsError = function(e){
      callback(e);
    }
    subscribeSuccess = function(result){
      debug("Subscribed success: ", result);
      if(result.status == "subscribed"){
        //subscribe success
        //TODO: Should this really be our complete callback? we might not have read all desciptors or characteristics yet
        callback(null);
      }
      else if(result.status == "subscribedResult"){
        //aka receive()
        var bytes = bluetoothle.encodedStringToBytes(result.value);
        var buf = new Buffer(bytes);
        stream.push(buf);
      }
    }
    subscribeError = function(e){
      callback(e);
    }

    //Kick off the descovery process services->characteristics->descriptors
    bluetoothle.services(servicesSuccess, servicesError, {
      "address": address,
      "services": []
    });
  }
}

util.inherits(BTLEConnection, Connection)

module.exports = Client(new BTLEScanner(), BTLEConnection)
