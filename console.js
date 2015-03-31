if (process.argv.length < 4) {
  console.log('Usage: node console.js ADDRESS CHANNEL');
  return;
}

var BluetoothSerialPort = require('bluetooth-serial-port').BluetoothSerialPort;
var ResponseParser = require('./parser');
var async = require('async');
var cubelets = require('./index');
var Decoder = require('./decoder');
var config = require('./config.json');
var ResponseTypes = config['responses'];
var fs = require('fs');
var util = require('util');

function log(s) {
  fs.writeFileSync('console-debug.log', s + '\n');
}

var address = process.argv[2];
var channel = parseInt(process.argv[3]);
var serialPort = new BluetoothSerialPort();

var passiveCubeletID = Decoder.decodeID(new Buffer([3,2,1]));
var knobCubeletID = Decoder.decodeID(new Buffer([6,5,4]));
var flashlightCubeletID = Decoder.decodeID(new Buffer([12,11,10]));
var barGraphCubeletID = Decoder.decodeID(new Buffer([13,14,14]));

// Meter slots for cubelets
var meter = require('multimeter')(process);
meter.write('Block values:');
var maxMeterSlots = 5;
var meterSlots = [];
for (var i = 0; i < maxMeterSlots; ++i) {
  var bar = meter.rel(0, i + 1, {
    width: 32
  });
  var slot = {
    bar: bar,
    id: null
  }
  meter.write('\n');
  meterSlots[i] = slot;
}

// Command menu
meter.write('\n');
meter.write('Commands:\n');
meter.write('`a`: get all blocks ids\n');
meter.write('`n`: get neighbor block ids\n');
meter.write('`b`: set current block id\n');
meter.write('`v`: send block value\n\n');
meter.write('Enter command:\n');
meter.offset += 8;

function takeMeterSlot(id) {
  for (var i = 0; i < maxMeterSlots; ++i) {
    var slot = meterSlots[i];
    if (null === slot.id) {
      log('found slot: ' + util.inspect(slot));
      slot.id = id;
      return slot;
    }
  }
  return undefined;
}

function measure(id, value) {
  meterSlots.forEach(function(slot) {
    if (slot.id == id) {
      log('measuring slot: ' + id + ' = ' + value);
      slot.bar.ratio(value, 255, String(id + ' = ' + value));
    }
  })
}

serialPort.connect(address, channel, function(err) {
  if (err) {
    console.error('Error connecting to', address, channel);
    return;
  }

  console.log('Connected to', address, channel);

  // Create a parser to interpret responses.
  var parser = new ResponseParser();

  // Process responses
  parser.on('response', function(response) {
    var T = ResponseTypes;
    var c = response.type.code;
    if (T['REGISTER_BLOCK_VALUE'].code == c) {

    }
    else if (T['BLOCK_VALUE'].code == c) {

    }
    else if (T['DEBUG'].code == c) {

    }
    else if (T['GET_CONFIGURATION'].code == c) {

    }
    else if (T['GET_ROUTING_TABLE'].code == c) {

    }
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
    serialPort.write(data, function(err) {
      if (err) {
        console.error('Write error!', err);
      }
      else {
        console.log('Write:', data);
      }
    });
  }

  // function send(data) {
  //   if (true) {
  //     var delay = 50;
  //     function wait(callback) {
  //       setTimeout(callback, delay);
  //     }
  //     function writeByte(oneByte) {
  //       return function(callback) {
  //         serialPort.write(new Buffer([oneByte]), callback);
  //       }
  //     }
  //     var tasks = [];
  //     for (var i = 0; i < data.length; ++i) {
  //       tasks.push(wait);
  //       tasks.push(writeByte(data[i]));
  //     }
  //     async.series(tasks, function(err) {
  //       if (err) {
  //         console.error('Write error!', err);
  //       }
  //       else {
  //         console.log('Write:', data);
  //       }
  //     });
  //   }
  //   else {
  //     console.error('Serial port not open for writing!');
  //   }
  // }

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

serialPort.on('closed', function() {
  console.log('Goodbye.');
  process.exit(0);
});

// Take keyboard input one character at a time.
var keyboard = process.stdin;
keyboard.setRawMode(true);
keyboard.resume();
