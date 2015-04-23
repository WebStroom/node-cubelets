var util = require('util');
var events = require('events');
var async = require('async');
var BluetoothSerialPort = require('bluetooth-serial-port').BluetoothSerialPort;
var BluetoothConnection = require('../connection/bluetooth');

var Scanner = function() {
    events.EventEmitter.call(this);
    this.scan = function(callback) {
        var scanner = this;
        var connections = [];
        var serialPort = new BluetoothSerialPort();
        serialPort.listPairedDevices(function(pairedDevices) {
            var devices = pairedDevices.filter(function(device) {
                return (device.name && device.name.indexOf('Cubelet') !== -1)
            });
            devices.forEach(function(device) {
                var name = device.name;
                var connection = new BluetoothConnection(device);
                scanner.emit('pass', connection, name, device);
                connections.push(connection);
            });
            scanner.emit('complete', null, connections);
            if (callback) {
                callback(null, connections)
            }
        });
    };
};

util.inherits(Scanner, events.EventEmitter);
module.exports = Scanner;
