var Scanner = require('./scanner/bluetooth');

var scanner = new Scanner();

scanner.on('pass', function (connection, name, device) {
  console.log('pass', connection, name, device);
});

scanner.scan(function (err, devices) {
  if (err) {
    console.error(err);
  } else {
    console.log(devices);
  }
});
