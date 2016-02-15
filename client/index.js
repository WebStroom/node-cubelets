var platform = process.platform;
platform = /^win/.test(platform)? 'win' : /^darwin/.test(platform)? 'mac' : 'linux' + (process.arch == 'ia32' ? '32' : '64');
if(platform === 'win')
{
	module.exports = require('./bluetoothSerial')
}
else
{//Use regular serial port on OSX
	module.exports = require('./serial')
}

//module.exports = require('./serial')
//module.exports = require('./net)
//module.exports = require('./ws)
//etc.
