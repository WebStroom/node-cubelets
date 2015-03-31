if (process.argv.length < 4) {
  console.log('Usage: node console.js ADDRESS CHANNEL');
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
  fs.writeFileSync('console-debug.log', s + '\n');
}

var address = process.argv[2];
var channel = parseInt(process.argv[3]);
var serialPort = new BluetoothSerialPort();

var passiveCubeletID = Decoder.decodeID(new Buffer([3,2,1]));
var knobCubeletID = Decoder.decodeID(new Buffer([6,5,4]));
var flashlightCubeletID = Decoder.decodeID(new Buffer([12,11,10]));
var barGraphCubeletID = Decoder.decodeID(new Buffer([13,14,14]));

// Take keyboard input one character at a time.
var keyboard = process.stdin;
keyboard.setRawMode(true);
keyboard.on('data', function(data) {
  var key = data.readUInt8(0);
  log('Pressed key:' + key);
  switch (key) {
    case 0x0D:
      write('\n');
      break;
  }
});

// Provide meters in slots [1..maxMeterSlots]
var maxMeterSlots = 5;
var meter = require('multimeter')(process);
meter.write('Block values:');
var meterSlots = [];
for (var i = 0; i < maxMeterSlots; ++i) {
  var bar = meter.rel(0, i, {
    width: 32
  });
  var slot = {
    bar: bar,
    id: null
  }
  meter.write('\n');
  meterSlots[i] = slot;
}

function write(s) {
  if (s) {
    meter.write(s);
    meter.offset += (String(s).match(/\n/) || []).length
  }
}

// Command menu
write('\n');
write('Commands:\n');
write('`c`: get configuration\n');
write('`e`: send echo request\n');
write('`l`: send LED command\n');
write('`a`: get all blocks ids\n');
write('`n`: get neighbor block ids\n');
write('`r`: register block value events\n');
write('`u`: unregister block value events\n');
write('`b`: change bargraph value\n');
write('`f`: change flashlight value\n');
write('Enter Commands:\n');

// Testing out meter UI
// var num = 0;
// takeMeterSlot(passiveCubeletID);
// takeMeterSlot(barGraphCubeletID);
// takeMeterSlot(knobCubeletID);
// takeMeterSlot(flashlightCubeletID);
// setInterval(function() {
//   num += 5;
//   if (num > 255) num = 0;
//   measure(passiveCubeletID, num);
//   measure(barGraphCubeletID, num);
//   measure(knobCubeletID, 255 - num);
//   measure(flashlightCubeletID, num);
//   measure('meow', 255 - num);
// }, 20);
// return;

function takeMeterSlot(id) {
  // Do not allow taking already assigned slots
  for (var i = 0; i < maxMeterSlots; ++i) {
    var slot = meterSlots[i];
    if (slot.id == id) {
      log('slot for ' + id + ' already taken');
      return -1;
    }
  }
  for (var i = 0; i < maxMeterSlots; ++i) {
    var slot = meterSlots[i];
    if (null === slot.id) {
      log('took meter slot ' + i + ' for ' + id);
      slot.id = id;
      return i;
    }
  }
  log('slot not found');
  return -1;
}

function measure(id, value) {
  meterSlots.forEach(function(slot) {
    if (slot.id == id) {
      value = String(Math.min(Math.max(value, 0), 255));
      id = String(id);
      slot.bar.ratio(value, 255, String(pad(8, id) + ' = ' + pad(3, value)));
    }
  })
}

write('Connecting...\n');

serialPort.connect(address, channel, function(err) {
  if (err) {
    console.error('Error connecting to', address, channel);
    return;
  }

  write('Connected to ' + address + '\n');

  // Create a parser to interpret responses.
  var parser = new ResponseParser();

  // Process responses
  parser.on('response', function(response) {
    var T = ResponseTypes;
    var c = response.type.code;
    if (T['REGISTER_BLOCK_VALUE'].code == c) {
      write('\nBlock value events are ' + (response.enabled ? 'on' : 'off') + '\n');
    }
    else if (T['BLOCK_VALUE'].code == c) {
      var id = response.id;
      takeMeterSlot(id);
      var value = response.value;
      measure(id, value);
    }
    else if (T['DEBUG'].code == c) {
      write('\nDebug: ' + util.inspect(response.data) + '\n');
    }
    else if (T['GET_CONFIGURATION'].code == c) {
      var s = '\n';
      s += ('My ID: ' + response.id + '\n');
      s += ('Hardware version: ' + response.hardwareVersion.toString() + '\n');
      s += ('Bootloader version: ' + response.bootloaderVersion.toString() + '\n');
      s += ('Application version: ' + response.applicationVersion.toString() + '\n');
      write(s);
    }
    else if (T['GET_ROUTING_TABLE'].code == c) {
      var ids = response.ids;
      write('\nAll block ids: ' + String(ids) + '\n');
      ids.forEach(function(id) {
        takeMeterSlot(id);
        measure(id, 0);
      })
    }
    else if (T['ECHO'].code == c) {
      var echo = response.echo;
      write('\nEcho: ' + util.inspect(echo) + '\n');
    }
  });

  // Process extra data
  parser.on('extra', function(data) {
    log('Extra: ' + util.inspect(data));
  });

  // Once serial connection is open, begin listening for data.
  serialPort.on('data', function(data) {
    log('Read: ' + util.inspect(data));
    parser.parse(data);
  });

  function send(data) {
    serialPort.write(data, function(err) {
      if (err) {
        log('Write error! ' + util.inspect(data));
      }
      else {
        log('Write: ' + util.inspect(data));
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
    return flashlightValue = flashlightValue == 0 ? 255 : 0;
  }

  var barGraphIndex = 0;
  var barGraphValues = [0, 32, 64, 96, 128, 160, 192, 224, 255, 224, 192, 160, 128, 96, 64, 32, 0];
  function nextBarGraphValue() {
    barGraphIndex = barGraphIndex < barGraphValues.length ? barGraphIndex + 1 : 0;
    return barGraphValues[barGraphIndex];
  }

  var barGraphSineWaveTimer = null;
  function toggleBarGraphSineWave() {
    if (barGraphSineWaveTimer) {
      clearTimeout(barGraphSineWaveTimer);
    }
    else {
      var fps = 20;
      setInterval(function() {
        send((new cubelets.SetBlockValueCommand(barGraphCubeletID, nextBarGraphValue())).encode());
      }, 1000/fps)
    }
  }

  // Respond to control events
  keyboard.on('data', function(data) {
    var key = data.readUInt8(0);
    switch (key) {
      // 'c'
      case 0x63:
        send((new cubelets.GetConfigurationRequest()).encode())
        break;
      // 'a'
      case 0x61:
        send((new cubelets.GetRoutingTableRequest()).encode())
        break;
      // 'n'
      case 0x6E:
        send((new cubelets.GetRoutingTableRequest()).encode())
        break;
      // 'r'
      case 0x72:
        send((new cubelets.RegisterBlockValueEventRequest(true)).encode())
        break;
      // 'u'
      case 0x75:
        send((new cubelets.RegisterBlockValueEventRequest(false)).encode())
        break;
      // 'e'
      case 0x65:
        send((new cubelets.EchoRequest(nextEchoSequence())).encode())
        break;
      // 'l'
      case 0x6C:
        send((new cubelets.SetLEDColorCommand(nextLEDColor())).encode())
        break;

      // 'b'
      case 0x62:
        toggleBarGraphSineWave();
        break;
      // 'f'
      case 0x66:
        send((new cubelets.SetBlockValueCommand(flashlightCubeletID, nextFlashlightValue())).encode());
        break;

      // '1'
      case 0x31:
        break;
      // '2'
      case 0x32:
        break;
      // '3'
      case 0x33:
        break;
      // '4'
      case 0x34:
        break;
      // '5'
      case 0x35:
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

      // Ctrl+D
      case 0x04:
        // Disconnect
        serialPort.close();
        break;
    }
  });
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
