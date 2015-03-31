if (process.argv.length < 4) {
  console.log('Usage: node aaa.js ADDRESS CHANNEL');
  return;
}

var BluetoothSerialPort = require('bluetooth-serial-port').BluetoothSerialPort;
var ResponseParser = require('./parser');
var async = require('async');
var cubelets = require('./index');
var Encoder = require('./encoder');
var Decoder = require('./decoder');
var config = require('./config.json');
var ResponseTypes = config['responses'];
var fs = require('fs');
var util = require('util');
var pad = require('pad');

function log(s) {
  fs.writeFileSync('aaa-debug.log', s + '\n');
}

var address = process.argv[2];
var channel = parseInt(process.argv[3]);
var serialPort = new BluetoothSerialPort();

serialPort.on('data', function(data) {
  console.log(data.toString('ascii'));
});

serialPort.connect(address, channel, function(err) {
  if (err) {
    console.error('Error connecting to', address, channel);
    return;
  }

  console.log('Connected to ' + address);
  var msg = "aaaaaaaaaaaaaaaaaaaabaaaaaaaaaaaaaaaaaaaa"
  serialPort.write(new Buffer(msg, 'ascii'), function(err) {
    if (err) {
      console.error('Write error!', err);
    }
  })
})

// Take keyboard input one character at a time.
var keyboard = process.stdin;
keyboard.setRawMode(true);
keyboard.on('data', function(data) {
  var key = data.readUInt8(0);
  log('Pressed key:' + key);
  switch (key) {
    case 0x0D:
      serialPort.close();
      break;
  }
});

// Handle errors on the serial port
serialPort.on('error', function(err) {
  write('\nSerial port error!', err);
  process.exit(1);
});

serialPort.on('closed', function() {
  write('Goodbye.\n');
  process.exit(0);
});
