var args = process.argv
if (args.length < 3) {
  console.log('Usage: node bin/downgrade PATH {{DEFAULT_COLOR}}')
  process.exit(1)
}

var fs = require('fs')
var async = require('async')
var clc = require('cli-color')

var cubelets = require('../index')
var Block = require('../block')
var BlockTypes = require('../blockTypes')
var MCUTypes = require('../mcuTypes')
var InfoService = require('../services/info')
var ImagoProtocol = require('../protocol/imago')
var ImagoProgram = ImagoProtocol.Program
var ImagoFlash = ImagoProtocol.Flash
var ClassicProtocol = require('../protocol/classic')
var ClassicProgram = ClassicProtocol.Program
var ClassicFlash = ClassicProtocol.Flash
var BootstrapProtocol = require('../protocol/bootstrap')
var FirmwareService = require('../services/firmware')
var Version = require('../version')
var Os3LatestVersions = require('../downgrade/config.json')['latestOS3Versions']
var IdService = require('../services/id')

var FirmwareType = {
  CLASSIC: 0,
  IMAGO: 1,
  BOOTSTRAP: 2
}
var firmwareService = new FirmwareService()
var idService = new IdService()

// Console output colors
var error = clc.bgRed.white.bold
var success = clc.bgGreen.white.bold

//Holds the block info for the Cubelet being downgraded
var downgradeBlock

if (args.length === 3) {
  // Default color of the terminal window
  defaultColor = '\x1b[37;40m'
} else {
  var defaultColor = args[3]
}

var device = {
  path: args[2]
}

var client = cubelets.connect(device, function (err) {
  if (err) {
    exitWithError(err)
  } else {
    console.log('Connected. Starting upgrade...')
    start(client, true)
  }
})

client.on('disconnect', function () {
  console.log('Disconnected.')
})
function start (client, firstRun) {
	
	//Check what BT firmware is running
	//Flash the super special (CRC toggleable) OS4 bt firmware if necessary
	//Wait for a (non-crc) cubelet
	//Determine the ID of the connected Cubelet
	//If the ID could be bad, keep a log of it (ie: if it suffered from the memory location problem. the lfsr will be fixed automagically), we will need to compare later.
	//Flash the deep-memory CRC supported OS4 Bootloader
	//Enable CRCs (stored in eeprom enabling CRCs before comm starts)
	//Restart BT
	//Verify the Cubelet is there (it may have a different ID)
	//If it possibly had a bad ID, and the ID didn't change, notify operator that the block needs wanded
	
	
	var tasks = [
		disableCrcs,
  	waitForOs4Block,
  	verifyTargetNeedsUpgrade,
  	logIfBadId,
  	flashUpgradeBootloader,
  	resetBT,
  	enableCrcs,
  	verifyOS4,
  	flashModifiedPicBootstrap,
  	resetBT,
  	enableCrcs,
  	verifyOS4, 
  	checkForBadID, 
  	flashOs4Application, 
  	verifyOS4,
  	resetBT,
  	done
  ]
  
  if(firstRun)
  {
  	tasks.unshift(flashHostIfNeeded)
  	tasks.unshift(checkBluetoothOperatingMode)
  }
	
  async.waterfall(tasks, function (err, result) {
    if (err) {
      exitWithError(err)
    }
    try
    {
    	console.timeEnd("Upgraded in");
    }
    catch(err){}
    
    start(client, false)
    return
  })
}

function checkBluetoothOperatingMode (callback) {
  // Switch to the classic protocol
  client.setProtocol(ClassicProtocol)
  client.sendRequest(new ClassicProtocol.messages.KeepAliveRequest(), function (err, response) {
    if (err) {
      console.log('Bluetooth block is running OS4 application.')
      callback(null, FirmwareType.IMAGO)
    } else if (response.payload.length > 0) {
      console.log('Bluetooth block is running OS4 bootstrap application.')
      // The bootstrap protocol will differentiate itself by
      // sending an extra byte in the response.
      callback(null, FirmwareType.BOOTSTRAP)
    } else {
      console.log('Bluetooth block is running OS3 application/bootloader.')
      callback(null, FirmwareType.CLASSIC)
    }
  })
}

function flashHostIfNeeded (fromMode, callback) {
  if (fromMode === FirmwareType.BOOTSTRAP) { // Already in bootstrap mode
    console.log('Bluetooth seems to be in bootstrap mode, flashing to OS4 mode. TODO')
    callback(new Error("Flashing from bootstrap to OS4 isn't implemented"))
  } else if (fromMode === FirmwareType.CLASSIC) { // Classic
    client.setProtocol(ClassicProtocol)
    console.log('Begin flashing bluetooth bootstrap code from OS3 mode. TODO')
    callback(new Error("Flashing from OS3 to OS4 isn't implemented"))
  } else { // Imago
    client.setProtocol(ImagoProtocol)
    callback(null)
  }
}

function disableCrcs(callback)
{
	client.sendRequest(new Protocol.messages.SetCrcsRequest(0), function(err, response) {
		callback(err);
	})
}

function waitForOs4Block(callback)
{
	//TODO
	//Check if there is already an OS4 block
		//if yes, callback(block)
		//Make sure there is only a single block, warn user if not
		//else
			//Register for block added events
}

function verifyTargetNeedsUpgrade(callback, block)
{
	//Send get config to block
	//Read version
		//If < 4.1.0 then continue
		//Else
			//Tell the user to remove the block, it's already been upgraded
}

function logIfBadId(callback, block)
{
		//if the ID matches the bad ID pattern, store the ID to compare to later
}

function flashUpgradeBootloader(callback, block)
{
	//Flash the deep memory bootloader
}

function flashOs4Application(callback, block)
{
	//Flash the usual application
}

function resetBT(callback)
{
	client.sendCommand(new ImagoProtocol.messages.ResetCommand())
	callback(null)
}

function enableCrcs(callback)
{
	client.sendRequest(new Protocol.messages.SetCrcsRequest(1), function(err, response) {
		callback(err);
	})
}

function verifyOS4(callback)
{
	//Make sure we see an OS4 block
}

function flashModifiedPicBootstrap(callback, block)
{
	//TODO: Flash the pic bootloader + verification app
	
}

function checkForBadID(callback, block)
{
	//TODO: Check to see if the block could still have a bad ID, bail if so
}

function done(callback)
{
	callback(null, 'done')
}


function parseVersion (floatValue) {
  var major = Math.floor(floatValue)
  var minor = Math.floor(10 * (floatValue - major))
  return new Version(major, minor)
}

function formatBlockName (block) {
  return block.getBlockType().name.capitalizeFirstLetter() + ' (' + block.getBlockId() + ')'
}

String.prototype.capitalizeFirstLetter = function () {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

function printSuccessMessage (msg) {
  //80 blanks spaces to fill a complete line
  var fullLine = '                                                                                '
  // process.stdout.write(success(fullLine))
  process.stdout.write(success(fullLine))
  process.stdout.write(success(msg + (fullLine.substring(fullLine.length - msg.length))))
  process.stdout.write(success(fullLine))
  process.stdout.write(defaultColor)
}

function exitWithError (err) {
  console.error(error(err))
  if (client) {
    client.disconnect(function () {
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
}
