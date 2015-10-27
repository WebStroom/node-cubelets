var args = process.argv
if (args.length < 3) {
  console.log('Usage: node bin/downgrade PATH {{DEFAULT_COLOR}}')
  process.exit(1)
}

var fs = require('fs')
var async = require('async')
var clc = require('cli-color')

var __ = require('underscore')
var cubelets = require('../index')
var Protocol = cubelets.Protocol
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

var possiblyHasBadId = false;
var possiblyBadId = 0;

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
  	wait,
  	enableCrcs,
  	waitForOs4Block,
  	flashModifiedPicBootstrap,
  	resetBT,
  	wait,
  	enableCrcs,
  	waitForOs4Block, 
  	checkForBadID, 
  	flashOs4Application, 
  	resetBT,
  	wait,
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
	getAllBlocks(function(err, blocks) {
		if (err) {
			callback(err)
			return
		}
		
		if(blocks.length > 1)
		{
			callback(new Error("Please attach just one Cubelet to update"));
			return
		}
		else if(blocks.length == 1)
		{
			callback(null, blocks[0])
			return
		}
		else
		{
			console.log("Waiting for a Cubelet that needs to be updated.")
			client.once('event', function(message)
			{				
				if(message instanceof Protocol.messages.BlockAddedEvent)
				{
					waitForOs4Block(callback)
					return
				}
			})
		}		
	})
}

function getAllBlocks(callback)
{
	client.sendRequest(new Protocol.messages.GetAllBlocksRequest(), function (err, response) {
		if(err)
		{
			callback(err)
			return
		}
		if(response.blocks)
		{
			var blocks = []
      __.each(response.blocks, function (block) {
      	var b = new Block(block.blockId, block.hopCount, Block.blockTypeForId(block.blockType))      	
      	b._mcuType = MCUTypes.PIC
        blocks.push(b)
      })	
      callback(null, blocks)
		}
		else
		{
			callback(null, [])
		}		
	})
}


function verifyTargetNeedsUpgrade(block, callback)
{
	console.log("Verifying that the "+formatBlockName(block) +" cubelet needs upgraded.")
	var request = new ImagoProtocol.Block.messages.GetConfigurationRequest(block.getBlockId())
	client.sendBlockRequest(request, function (err, response) {
		if(err)
		{
			callback(err)
			return
		}
		
		//We only want to upgrade 4.0.x blocks 
		if(response.bootloaderVersion.isLessThan(new Version(4,1,0)))
		{
			callback(null, block)
		}
		else
		{
			callback(new Error("This cubelet, "+formatBlockName(block)+" does not need to be updated"))
		}
	})	
}

function logIfBadId(block, callback)
{
		//if the ID matches the bad ID pattern, store the ID to compare to later
		if(blockHasBadId(block.getBlockId()))
		{
			console.log("This block may have a corrupted ID. We will attempt to repair it.")
			possiblyHasBadId = true
			possiblyBadId = block.getBlockId()			
		}
		else
		{
			//Clear the log of potentially bad IDs
			possiblyHasBadId = false
		}		
		
		callback(null, block)
}

function flashUpgradeBootloader(block, callback)
{
	//Flash the deep memory bootloader
	console.log("Begin flashing the deep-memory temporary bootloader.")
	
	var hex = fs.readFileSync('./crc_upgrade/hex/crc_update_bootloader/crc_update_bootloader.hex')
  var program = new ImagoProgram(hex)
  
	var flash = new ImagoFlash(client, {
		skipSafeCheck : true
	})//TODO: Determine if skipSafeCheck is needed
	
	flash.programToBlock(program, block, function(err) {
		if(err)
		{
			callback(err)
			return
		}
		callback(null)		
	})
	
	flash.on('progress', function(e) {
		console.log('progress', '(' + e.progress + '/' + e.total + ')')
	})
}


function flashModifiedPicBootstrap(block, callback) {
	//TODO: Flash the pic bootloader + verification app
	var hex = fs.readFileSync('./crc_upgrade/hex/boot_id_fix/' + block.getBlockType().name + "_bootstrap.hex")
	var program = new ImagoProgram(hex)
	var flash = new ImagoFlash(client, {
		skipSafeCheck : true
	})
	flash.programToBlock(program, block, function(err) {
		if (err) {
			callback(err)
			return
		}
		callback(null)
	})
}
function checkForBadID(block, callback)
{
	//Check to see if the block could still have a bad ID, bail if so
	if(possiblyHasBadId)
	{
		if(possiblyBadId === block.getBlockId())
		{
			callback(new Error("Was unable to fix the ID corruption. This Cubelet will need to be re-flashed using the wand."))
			return
		}
	}	
	callback(null, block)
}

function flashOs4Application(block, callback) {
	//Flash the usual application
	var applicationHex = fs.readFileSync('./upgrade/hex/application/' + block.getBlockType().name + ".hex")
	var program = new ImagoProgram(applicationHex)
	flash = new ImagoFlash(client)
	flash.on('progress', function(e) {
		console.log('progress', '(' + e.progress + '/' + e.total + ')')
	})
	flash.programToBlock(program, block, function(err) {
		if (err) {
			callback(err)
			return
		} 
		console.log("\nSuccessfully flashed " + block.getBlockType().name + " firmware to " + block.getBlockId() + ".")
		callback(null)
	})
}

function wait(howLong, callback)
{
	setTimeout(howLong, function()
	{
		callback(null)
	})
}

function resetBT(callback)
{
	client.sendCommand(new ImagoProtocol.messages.ResetCommand())
	callback(null, 200)
}

function enableCrcs(callback)
{
	client.sendRequest(new Protocol.messages.SetCrcsRequest(1), function(err, response) {
		callback(err);
	})
}

function done(callback)
{
	callback(null, 'done')
}


function blockHasBadId (blockId) {
	
	var ID0 = ((blockId & 0x0000FF));
	var ID1 = ((blockId & 0x00FF00) >> 8);
	var ID2 = ((blockId & 0xFF0000) >> 16);
	
	if(ID2 === ID0 && ID2 === 0x03)
	{
		return true;
	}
	else
	{
		return false;
	}
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
