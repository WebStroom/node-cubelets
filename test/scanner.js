var scanner = require('../client/bluetoothSerial')
console.log(scanner)

scanner.getDevices(function(err, devices)
{
	console.log(err)
	console.log(devices)
})
