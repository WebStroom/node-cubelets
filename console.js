if (process.argv.length < 3) {
  console.log('Usage: node console.js SERIALPORT');
  return;
}

var SerialPort = require('serialport').SerialPort;
var ResponseParser = require('./parser');
var cubelets = require('./index');
var Encoder = require('./encoder');

var path = process.argv[2];
var serialPort = new SerialPort(path);

var passiveCubeletID = 197121;
var knobCubeletID = 394500;
var flashlightCubeletID = 789258;
var barGraphCubeletID = Encoder.encodeID(new Buffer([13,14,14]));

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
  var echoSize = 20;
  function nextEchoSequence() {
    var bytes = [];
    for (var i = 0; i < echoSize; ++i) {
      bytes.push(echoNumber);
      echoNumber = echoNumber < 255 ? echoNumber + 1 : 0;
    }
    return new Buffer(bytes);
  }

  var enableBlockValueEvent = false;
  function toggleEnableBlockValueEvent() {
    return enableBlockValueEvent = !enableBlockValueEvent;
  }

  var flashlightValue = 0;
  function nextFlashlightValue() {
    // return flashlightValue = flashlightValue == 0 ? 255 : 0;
    return 255;
  }

  var barGraphValue = 0;
  function nextBarGraphValue() {
    switch (barGraphValue) {
      case 0:
        return barGraphValue = 8;
      case 8:
        return barGraphValue = 16;
      case 16:
        return barGraphValue = 32;
      case 32:
        return barGraphValue = 64;
      case 64:
        return barGraphValue = 128;
      case 128:
        return barGraphValue = 255;
      default:
        return barGraphValue = 0;
    }
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
      // '4'
      case 0x34:
        send((new cubelets.RegisterBlockValueEventRequest(toggleEnableBlockValueEvent())).encode())
        break;
      // '5'
      case 0x35:
        send((new cubelets.GetRoutingTableRequest()).encode())
        break;
      // '6'
      case 0x36:
        break;
      // '7'
      case 0x37:
        break;
      // '8'
      case 0x38:
        break;
      // '9'
      case 0x39:
        break;
      // 'b'
      case 0x62:
        send((new cubelets.SetBlockValueCommand(barGraphCubeletID, nextBarGraphValue())).encode());
        break;
      // 'f'
      case 0x66:
        send((new cubelets.SetBlockValueCommand(flashlightCubeletID, nextFlashlightValue())).encode());
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
