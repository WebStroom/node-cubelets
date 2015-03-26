if (process.argv.length < 3) {
  console.log('Usage: node console.js SERIALPORT');
  return;
}

var SerialPort = require('serialport').SerialPort;
var ResponseParser = require('./parser');
var cubelets = require('./index');

var path = process.argv[2];
var serialPort = new SerialPort(path);

serialPort.on('open', function(err) {
  if (err) {
    console.error('Error connecting to', path);
    return;
  }

  console.log('Connected to', path);

  // Create a parser to interpret responses.
  var parser = new ResponseParser();

  // Process responses
  parser.on('response', function(response) {
    console.log('Response:', response);
  });

  // Process extra data
  parser.on('extra', function(data) {
    console.log('Extra:', data);
  });

  // Process raw data
  parser.on('raw', function(data) {
    console.log('Raw:', data);
  });

  // Once serial connection is open, begin listening for data.
  serialPort.on('data', function(data) {
    console.log('Read:', data);
    parser.parse(data);
  });

  function send(data) {
    if (true) {
      console.log('Write:', data);
      serialPort.write(data, function(err) {
        if (err) {
          console.error('Write error!', err);
          return;
        }
        console.log('Wrote:', data);
        // serialPort.drain(function(err) {
        //   if (err) {
        //     console.error('Drain error!', err);
        //     return;
        //   }
        //   console.log('Write:', data);
        // });
      });
    }
    else {
      console.error('Serial port not open for writing!');
    }
  }

  var LEDColor = 0;
  function nextLEDColor() {
    return LEDColor = (LEDColor === 7) ? 0 : LEDColor + 1;
  }

  var echoNumber = 0;
  var echoSize = 10;
  function nextEchoSequence() {
    var bytes = [];
    for (var i = 0; i < echoSize; ++i) {
      bytes.push(echoNumber);
      echoNumber = echoNumber < 255 ? echoNumber + 1 : 0;
    }
    return new Buffer(bytes);
  }

  // Respond to control events
  keyboard.on('data', function(data) {
    var key = data.readUInt8(0);
    console.log('Pressed key:', key);
    switch (key) {
      // '1'
      case 0x31:
        send((new cubelets.GetConfigurationRequest()).encode())
        break;
      // '2'
      case 0x32:
        send((new cubelets.SetLEDColorCommand(nextLEDColor())).encode())
        break;
      // '3'
      case 0x33:
        send((new cubelets.EchoRequest(nextEchoSequence())).encode())
        break;
      // Ctrl+D
      case 0x04:
        // Disconnect
        serialPort.close();
        break;
      // Ctrl+R
      case 0x12:
        // Toggle raw
        var raw = !parser.getRawMode();
        console.log('Raw mode:', raw ? 'On' : 'Off');
        parser.setRawMode(raw);
        break;
    }
  });
});

// Handle errors on the serial port
serialPort.on('error', function(err) {
  console.error('Serial port error!', err);
  process.exit(1);
});

serialPort.on('close', function() {
  console.log('Goodbye.');
  process.exit(0);
});

// Take keyboard input one character at a time.
var keyboard = process.stdin;
keyboard.setRawMode(true);
keyboard.resume();
