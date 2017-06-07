var validClientTypes = [  'bluetoothSerial',
                          'browser',
                          'btleUART',
                          'chrome',
                          'chromeSerial',
                          'cordova',
                          'cordovaBTSerial',
                          'nobleSerial',
                          'demo',
                          'net',
                          'serial'];

module.exports = function(clientType){
  if(!clientType || validClientTypes.indexOf(clientType) < 0){
    clientType = 'serial';
  }
  var cubelets = require('./client/index')(clientType);

  cubelets.Block = require('./block')
  cubelets.BlockTypes = require('./blockTypes')
  cubelets.MCUTypes = require('./mcuTypes')
  cubelets.Version = require('./version')
  cubelets.InfoService = require('./services/info')
  cubelets.FirmwareService = require('./services/firmware')
  cubelets.ImagoFirmwareService = require('./services/imagoFirmware')
  return cubelets;
}
