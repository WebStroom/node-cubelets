var BluetoothSerialPort = require('bluetooth-serial-port').BluetoothSerialPort;

var serialPort = new BluetoothSerialPort();
serialPort.listPairedDevices(function(pairedDevices) {
  pairedDevices.forEach(function(device) {
    console.log(device);
  })
})