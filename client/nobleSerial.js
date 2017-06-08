var debug = require('debug')('cubelets:nobleSerial')
var util = require('util')
var Scanner = require('../scanner')
var Connection = require('../connection')
var Client = require('../client')
var xtend = require('xtend')
var noble = require('noble');

//Nordic UART UUIDs
var SERVICE_UUID =  '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
var RX_UUID =       '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
//This is the characteristic we should receive data on. Perhaps switch
var TX_UUID =       '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';

noble.on('warning', function(message){
  debug("Warning Received: ", message);
});

var BTLEScanner = function (opts) {
  Scanner.call(this)
  var scanner = this;
  scanner.state = "notReady";
  noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
      scanner.state = "ready";
      scanner.emit("ready");
    }
    else{
      scanner.state = "notReady";
    }
  });

  noble.on('scanStart', function(){
    debug("Scan started");
    scanner._scanning = true;
  });
  noble.on('scanStop', function(){
    debug("Scan stopped");
    scanner._scanning = false;
    noble.removeListener('discover', scanner.onDeviceDiscovered);
  });

  this._getDevices = function (callback) {
    //TODO:
    var devices = [];
    callback(null, devices);
  }

  // Add a discovery method that can call a callback repeatedly with RSSi updates
  this._startScan = function(deviceAddedCallback, deviceUpdatedCallback, callback){

    var beginScan = function(){
      noble.startScanning([], true);
    }
    scanner.onDeviceDiscovered = function(peripheral){
      if(!peripheral || !peripheral.advertisement || !peripheral.advertisement.localName){
        return;
      }

      if(peripheral.advertisement.localName.toLowerCase().indexOf('cubelet') === 0)
      {
        peripheral.btType = 'le';
        if(scanner._add(peripheral)){
          //New Device
          deviceAddedCallback(peripheral);
        }
        else{
          //Updated Device
          deviceUpdatedCallback(peripheral);
        }
      }
    };
    noble.on('discover', scanner.onDeviceDiscovered);

    if(scanner.state != "ready"){
      scanner.once('ready', beginScan);
    }
    else if(scanner._scanning){
      scanner.stopDeviceScan(beginScan);
    }
    else{
      beginScan();
    }

  }
  //Override of Scanner
  this.startDeviceScan = function (deviceAddedCallback, deviceUpdatedCallback, callback) {
    scanner._scanning = true
    scanner._startScan(deviceAddedCallback, deviceUpdatedCallback, callback);
  }
  this._stopScan = function(callback){
    noble.stopScanning();
    callback(null);
  }
  //Override of Scanner
  this.stopDeviceScan = function (callback) {
    scanner._scanning = false
    this._stopScan(callback);
  }

  this._compareDevice = function (device, otherDevice) {
    return device.id == otherDevice.id
  }
}

util.inherits(BTLEScanner, Scanner)

var BTLEConnection = function (device, opts) {
  Connection.call(this, device, opts)

  //var address = device['address'] || '00:00:00:00:00:00'
  //var services = device['services']
  //var channelID = (typeof device['channelID'] !== undefined) ?
  //  device.channelID : (Array.isArray(services) && services.length > 0) ?
  //    services[0].channelID : 1
  var stream = this;
  var isOpen = false

  var writeCharacteristic = null;
  var readCharacteristic = null;

  this._read = function (n) {
    // do nothing
  }

  this._write = function (chunk, enc, next) {
    if(writeCharacteristic){
      writeCharacteristic.write(chunk, true, next);
    }
  }
  function toArrayBuffer(arr){
    var r = new Uint8Array(arr);
    return r.buffer;
  }
  this._open = function (callback) {
    //device == peripheral

    //Event handler for disconnect detect.
    device.once('disconnect', function(){
      isOpen = false;
      debug("Disconnected");
      //Call the disconnected event
      stream.close(function(){});
    });

    device.once('connect', function(){
      debug("Connected");
      isOpen = true;
      device.discoverAllServicesAndCharacteristics(function(err, services, characteristics){
        characteristics.forEach(function(characteristic){
          if(uuidCompare(characteristic.uuid, TX_UUID)){
            readCharacteristic = characteristic;
            characteristic.subscribe(function(err){
              if(err){
                debug("Subscribe Error: ", err)
                callback(err);
                return;
              }
              debug("Subscribed to TX_CHAR.")
              characteristic.on('data', function(data, isNotification){
                debug("Received: ", data);
                stream.push(data);
              });
              //Connected callback
              callback(null);
            });
          }
          else if(uuidCompare(characteristic.uuid, RX_UUID)){
            writeCharacteristic = characteristic;
          }
        });
      });
    });
    device.connect(function(err){
      if(err){
        callback(err)
      }
    });
  }
  this._close = function (callback) {
    if(isOpen){
      isOpen = false;
      device.disconnect(function(){
        callback(null);
      });
    }
    else{
      callback(null);
    }
  }
}

function uuidCompare(uuid1, uuid2){
  uuid1 = uuid1.replace(/-/g, "").toLowerCase();
  uuid2 = uuid2.replace(/-/g, "").toLowerCase();
  return uuid1 == uuid2;
}

util.inherits(BTLEConnection, Connection)

module.exports = Client(new BTLEScanner(), BTLEConnection)
