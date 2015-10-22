var args = process.argv
if (args.length < 3) {
  console.log('Usage: node bin/downgrade PATH {{DEFAULT_COLOR}}')
  process.exit(1)
}

var fs = require('fs')
var async = require('async')
var prompt = require('cli-prompt')
var __ = require('underscore')
var clc = require('cli-color')

var cubelets = require('../index')
var Block = require('../block')
var BlockTypes = require('../blockTypes')
var MCUTypes = require('../mcuTypes')
var CompatibilityCheck = require('../upgrade/compatibilityCheck')
var InfoService = require('../services/info')
var ImagoProtocol = require('../protocol/imago')
var ImagoProgram = ImagoProtocol.Program
var ImagoFlash = ImagoProtocol.Flash
var ClassicProtocol = require('../protocol/classic')
var ClassicProgram = ClassicProtocol.Program
var ClassicFlash = ClassicProtocol.Flash
var BootstrapProtocol = require('../protocol/bootstrap')
var FirmwareService = require('../services/firmware')

var FirmwareType = {
  CLASSIC: 0,
  IMAGO: 1,
  BOOTSTRAP: 2
}

var UpdateService = require('../services/update')

// TODO: Service for marking a block as upgraded
var updateService = new UpdateService()

// Console output colors
var error = clc.bgRed.white.bold
var success = clc.bgGreen.white.bold

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
    start(client)
  }
})

client.on('disconnect', function () {
  console.log('Disconnected.')
})

function start (client) {	
	async.waterfall([
		checkBluetoothOperatingMode,
		flashBootstrapIfNeeded,
		waitForOs4Block,
		jumpToOs4Mode,
		wait,
		findOs4AndFlashBootloader,
		jumpToDiscoveryWaitForOs3,
		jumptoOs3Mode,
		downloadTargetHex,
		flashOs3Application,
		wait,
		jumpToDiscoveryFromOs3,
		verifyOs3
	], function(err, result)
	{
		if(err){exitWithError(err)}
		start(client)
		return
	})
}

function checkBluetoothOperatingMode(callback)
{
	// Switch to the classic protocol
  client.setProtocol(ClassicProtocol)
  client.sendRequest(new ClassicProtocol.messages.KeepAliveRequest(), function (err, response) {
  	if(err)
  	{
  		callback(null, FirmwareType.IMAGO)
  	}
  	else if(response.payload.length > 0)
  	{
  		// The bootstrap protocol will differentiate itself by
      // sending an extra byte in the response.
      callback(null, FirmwareType.BOOTSTRAP)
  	}
  	else
  	{
  		callback(null, FirmwareType.CLASSIC)
  	}
  })
}

function flashBootstrapIfNeeded(fromMode, callback) {
	if (fromMode == FirmwareType.BOOTSTRAP) {//Already in bootstrap mode
		callback(null)
	} else if (fromMode == FirmwareType.CLASSIC) {//Classic
		client.setProtocol(ClassicProtocol)
		client.sendData(new Buffer(['L'.charCodeAt(0)]), function(err) {
			if (err) {
				callback(err)
				return
			}
			flashBootstrapFromBootloader(callback)
		})
	} else {//Imago
		client.setProtocol(ImagoProtocol)
		var req = new ImagoProtocol.messages.SetModeRequest(0)
		client.sendRequest(req, function(err, res) {
			flashBootstrapFromBootloader(callback)
		}, 200)
	}
}

function flashBootstrapFromBootloader(callback) {
	var hex = fs.readFileSync('./upgrade/hex/bluetooth_bootstrap.hex')
	var program = new ClassicProgram(hex)
	client.setProtocol(ClassicProtocol)

	//Determine Host ID
	var req = new ClassicProtocol.messages.GetNeighborBlocksRequest()
	client.sendRequest(req, function(err, res) {
		if (err) {
			callback(err)
		} else {
			var originBlockId = res.originBlockId
			if (originBlockId > 0) {
				hostBlock = new Block(originBlockId, 0, BlockTypes.BLUETOOTH)
				hostBlock._mcuType = MCUTypes.AVR
				var flash = new ClassicFlash(client, {
					skipSafeCheck : true,
					skipReadyCommand: true
				})				
				flash.programToBlock(program, hostBlock, function(err) {
					callback(err)
				})
				flash.on('progress', function(e) {
					console.log('progress', '(' + e.progress + '/' + e.total + ')')
				})
			} else {
				callback(new Error('Host block not found.'))
			}
		}
	})
}

function waitForOs4Block(callback) {
	client.setProtocol(BootstrapProtocol)
	function waitForBlockEvent(e) {
		if ( e instanceof BootstrapProtocol.messages.BlockFoundEvent) {
			if(e.firmwareType == FirmwareType.IMAGO)
			{				
				client.removeListener('event', waitForBlockEvent)
				callback(null)
				return
			}			
		}
	}
	client.on('event', waitForBlockEvent)
}

function jumpToOs4Mode(callback) {
	client.setProtocol(BootstrapProtocol)
	client.sendRequest(new BootstrapProtocol.messages.SetBootstrapModeRequest(FirmwareType.IMAGO), function(err, response) {
		if(err)
		{
			callback(err)
		}
		else if(response.mode == FirmwareType.IMAGO)
		{
			callback(null, 1000)
		}
		else
		{
			callback(new Error('Failed to set host into OS4 mode'))
		}
	})
}

function wait(howLong, callback)
{
	setTimeout(function(){ callback(null) }, howLong)
}

function findOs4AndFlashBootloader(callback)
{
	client.setProtocol(ImagoProtocol)
	client.fetchNeighborBlocks(function (err, neighborBlocks) {
		if(err)
		{
			callback(err)
			return
		}	
		if(!neighborsBlocks || neighborBlocks.length <= 0)
		{
			callback(new Error("Failed to find OS4 block"))
			return
		}
		var targetBlock;
		targetBlock = neighborBlocks[0]
    targetBlock._mcuType = MCUTypes.PIC
    
    flashOs3BootloaderFromOs4(targetBlock, callback)
	})
}

function flashOs3BootloaderFromOs4(targetBlock, callback) {
	var hex = fs.readFileSync('./downgrade/pic_downgrader.hex')
	var program = new ImagoProgram(hex)
	var flash = new ImagoFlash(client, {
		skipSafeCheck : true
	})
	flash.programToBlock(program, targetBlock, function(err) {
		callback(err, targetBlock)
	})
	flash.on('progress', function(e) {
		console.log('progress', '(' + e.progress + '/' + e.total + ')')
	})
}


function jumpToDiscoveryWaitForOs3(targetBlock, callback) {
	client.sendCommand(new ImagoProtocol.messages.ResetCommand())
	setTimeout(function() {
		client.setProtocol(BootstrapProtocol)
		var timer = setTimeout(function() {
			client.removeListener('event', waitForBlockEvent)
			callback(new Error("Failed to discover OS3 bootloader block"))
			return
		}, 3000)
		function waitForBlockEvent(e) {
			if ( e instanceof BootstrapProtocol.messages.BlockFoundEvent) {
				clearTimeout(timer)				
				if(e.firmwareType == FirmwareType.CLASSIC)
				{
					client.removeListener('event', waitForBlockEvent)
					callback(null, targetBlock)
					return
				}
			}
		}
		client.on('event', waitForBlockEvent)
	})
}

function jumptoOs3Mode(targetBlock, callback) {
	client.setProtocol(BootstrapProtocol)
	client.sendRequest(new BootstrapProtocol.messages.SetBootstrapModeRequest(FirmwareType.CLASSIC), function(err, response) {
		client.setProtocol(ClassicProtocol)
		if(err)
		{
			callback(err)
		}
		else if(response.mode == FirmwareType.CLASSIC)
		{
			callback(null, targetBlock)
		}
		else
		{
			callback(new Error("Failed to jump from bootstrap to OS3 mode"))
		}
	})
}

function downloadTargetHex(targetBlock, callback)
{
	//TODO read version from config and manually fetch from the correct url
	var hex = "";//TODO
	callback(null, targetBlock, hex)	
}

function flashOs3Application(targetBlock, targetHex, callback) {
	var blockId = targetBlock.getBlockId()
	var faceIndex = targetBlock.getFaceIndex()
	var program = new ClassicProgram(targetHex)

	// XXX(donald): hack to not send reset command
	targetBlock._applicationVersion = new Version(0, 0, 0)

	var flash = new ClassicFlash(client, {
		skipSafeCheck : false
	})
	flash.programToBlock(program, targetBlock, function(err) {
		if(err){callback(err)}
	})
	flash.on('progress', function(e) {
		console.log('progress', '(' + e.progress + '/' + e.total + ')')
	})
	flash.on('success', function(e) {
		callback(e, 1000)
	})
	flash.on('error', function(e) {
		callback(err)
	})
}

function jumpToDiscoveryFromOs3(callback)
{
	client.sendCommand(new ClassicProtocol.messages.ResetCommand())
  callback(null)
}

function verifyOs3(callback) {
	setTimeout(function() {
		client.setProtocol(BootstrapProtocol)
		var timer = setTimeout(function() {
			client.removeListener('event', waitForBlockEvent)
			callback(new Error("Failed to find OS3 application block"))
			return
		}, 3000)
		function waitForBlockEvent(e) {
			if ( e instanceof BootstrapProtocol.messages.BlockFoundEvent) {
				clearTimeout(timer)
				client.removeListener('event', waitForBlockEvent)
				callback(null, 'done')
			}
		}
		client.on('event', waitForBlockEvent)
	})
}

/*		
  //Detect firmware running
  checkBluetoothOperatingMode(function(err, mode)
  {  	
  	flashBootstrapIfNeeded(mode, function(err)
  	{
  		if(err)
  		{
  			exitWithError(err)
  		}
  		
  		waitForOs4Block(function(err)
  		{
  			if(err){exitWithError(err)}
  			jumpToOs4Mode(function(err)
  			{
  				if(err){ exitWithError(err) }
  				wait(1000, function()
  				{
  					findOs4AndFlashBootloader(function(err, block)
  					{
  						if(err){exitWithError(err)}
  						jumpToDiscoveryWaitForOs3(function(err)
  						{
  							if(err){exitWithError(err)}
  							jumptoOs3Mode(function(err)
  							{
  								if(err){exitWithError(err)}
  								  								
  								downloadTargetHex(block, function(err, hex)
  								{
  									if(err){exitWithError(err)}
  									
  									flashOs3Application(block, hex, function(err)
  									{
  										wait(1000, function()
  										{
  											jumpToDiscoveryFromOs3(function(err){
  												if(err){exitWithError(err)}
  												verifyOs3(face, 2000, function(err)
  												{
  													if(err){exitWithError(err)}
  													start(client)
  													return
  												})  												
  											})
  										})
  									})  									
  								})  								
  							})
  						})
  					})
  				})
  			})
  		})  		
  	})  	
  })
  
  
  //Hangout until we detect an OS4 Cubelet
  //Jump to OS4 mode
  //Fetch blocks and choose one to flash, store it
  //Flash downgrader to the (currently OS4) Cubelet
  //Jump to discovery mode
  //Wait for OS3 cubelet to show up (on that face if possible)
  //Jump to OS3 mode
  //Fetch the correct hex file (version should come from config.json)
  //Flash the target block with the correct hex file (OS3 flashing mode)
  //On flash finish
  //	Push new version to datastore overwriting exisiting entry.
  //	show success/failure message 
  //	go back to beginning
  
}*/





function askYesOrNo (text, yesCallback, noCallback) {
  prompt(text + ' [Y/n] ', function (val) {
    (val.toLowerCase() === 'y' ?
      yesCallback : noCallback)()
  })
}

function formatNumber (n) {
  if (n === 0) return '0'
  else if (n === 1) return 'one'
  else if (n === 2) return 'two'
  else if (n === 3) return 'three'
  else if (n === 4) return 'four'
  else return n
}

function formatBlockName (block) {
  return block.getBlockType().name + ' (' + block.getBlockId() + ')'
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

function exitWithSuccess (msg) {
  console.log(msg)
  process.exit(0)
}
