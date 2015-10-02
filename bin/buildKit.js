var args = process.argv
if (args.length !== 3) {
	console.log('Usage: node bin/buildKit PATH')
	process.exit(1)
}

var device = {
	path : args[2]
}

var cubelets = require('../index')
var Protocol = cubelets.Protocol
var Kit = require('../kit/index.js')
var SixKit = require('../kit/six')
var TwelveKit = require('../kit/twelve')
var TwentyKit = require('../kit/twenty')
var Block = require('../block')
var __ = require('underscore')
var KitService = require('../services/kit')
var IdService = require('../services/id')
var encoder = require('../protocol/encoder')
var ImagoProtocol = require('../protocol/imago')

var kit = new Kit()
var kitService = new KitService()
var idService = new IdService()
var stdin = process.stdin

var client = cubelets.connect(device, function(err) {
	if (err) {
		exitWithError(err)
	} else {
		console.log('Connected.')
		start(client)
	}
})
client.on('disconnect', function() {
	console.log('Disconnected.')
})
function start(client) {
	promptForAnyKey('To detect a kit press any key.\n', function() {
		client.sendRequest(new Protocol.messages.GetAllBlocksRequest(), function(err, response) {
			if (err) {
				exitWithError(err)
			}

			var blocks = []
			__.each(response.blocks, function(block) {
				blocks.push(new Block(block.blockId, block.hopCount, Block.blockTypeForId(block.blockType)))
			})
			printBlocksFound(blocks)

			checkForBadBlocks(blocks, function(err, badBlocks) {
				if (badBlocks) {
					console.log("\n\n")
					start(client)
					return
				}

				if (blocks.length === 6) {
					validateSix(blocks, function() {
						start(client)
					})
				} else if (blocks.length === 12) {
					validateTwelve(blocks, function() {
						start(client)
					})
				} else if (blocks.length === 20) {
					validateTwenty(blocks, function() {
						start(client)
					})
				} else {
					console.log('No valid kit was detected:')
					validateSix(blocks, null)
					validateTwelve(blocks, null)
					validateTwenty(blocks, function() {
						start(client)
					})
				}
			})
		})
	})
}

function checkForBadBlocks(blocks, callback) {
	var count = blocks.length
	var badCount = 0
	__.each(blocks, function(block) {
		if (lfsrSeed(block.getBlockId()) == 0) {
			//Check if it's 4.0.1 or 4.0.0
			var request = new ImagoProtocol.Block.messages.GetConfigurationRequest(block.getBlockId())
			client.sendBlockRequest(request, function(err, response) {

				if (response.applicationVersion.major == 4 && response.applicationVersion.minor == 0 && response.applicationVersion.patch == 0) {
					console.log(formatBlockName(block) + " needs to be reflashed.")
					badCount++
				}
				count--
				if (count == 0) {
					if (badCount == 0) {
						callback(null, false)
						return
					} else {
						callback(null, true)
						return
					}
				}
			})
		} else {
			count--;
		}
	})
	if (count == 0) {
		if (badCount == 0) {
			callback(null, false)
		} else {
			callback(null, true)
		}
	}
}

//Checks for IDs that may suffer from
function lfsrSeed(blockId) {
	var ids = encoder.encodeId(blockId)
	var lfsr = ((ids[2] ^ ids[0] ^ ids[1] + ids[2]) & 0xFF)
	return lfsr
}

function validateSix(blocks, callback) {
	var expectedKit = new SixKit()
	validateKit(blocks, expectedKit, callback)
}

function validateTwelve(blocks, callback) {
	var expectedKit = new TwelveKit()
	validateKit(blocks, expectedKit, callback)
}

function validateTwenty(blocks, callback) {
	var expectedKit = new TwentyKit()
	validateKit(blocks, expectedKit, callback)
}

function validateKit(blocks, expectedKit, callback) {
	kit.verifyKit(expectedKit, blocks, function(isValid, missing, extra) {
		if (isValid) {
			addAllBlocks(blocks, function(err) {
				askToBuildKit(expectedKit, blocks, callback)
			})
		} else {
			kitVerificationFailure(expectedKit, blocks, missing, extra)
			if (callback) {
				callback(null)
			}
		}
	})
}

function addAllBlocks(blocks, callback) {
	__.each(blocks, function(block) {
		idService.addId(block, function(err) {

		})
	})
	callback()
}

function printBlocksFound(blocks) {
	console.log('Blocks Found:')
	__.each(blocks, function(block) {
		console.log('  ' + formatBlockName(block))
	})
	console.log('')
}

function askToBuildKit(type, blocks, callback) {
	console.log('This appears to be a valid ' + type.name + '.')
	promptYesOrNo('Do you want to complete the kit?', true, function(val) {
		if (val) {
			kitService.buildKit(blocks, function(err, kitId) {
				if (err) {
					exitWithError(err)
				}
				console.log('')
				console.log('')
				console.log('Successfully added kit to datastore: ' + kitId)
				console.log('')
				console.log('')
				if (callback) {
					callback(null)
				}
			})
		} else {
			console.log('')
			console.log('')
			if (callback) {
				callback(null)
			}
		}
	})
}

function kitVerificationFailure(type, blocks, missing, extra) {
	console.log('')
	console.log('Invalid ' + type.name + ' Kit:')
	if (missing.length > 0) {
		console.log('  Misssing:')
		__.each(missing, function(block) {
			console.log('    ' + block.name.capitalizeFirstLetter())
		})
	}
	if (extra.length > 0) {
		console.log('  Extra:')
		__.each(extra, function(block) {
			console.log('    ' + block.name.capitalizeFirstLetter())
		})
	}
	console.log('')
}

function promptForAnyKey(message, callback) {
	stdin.setRawMode(true)
	stdin.resume()
	stdin.setEncoding('utf8')

	console.log(message)
	stdin.once('data', function(key) {
		if (key == '\u0003') {
			process.exit()
		}// ctrl-c
		stdin.pause()
		if (callback) {
			callback()
		}
	})
}

function promptYesOrNo(message, _default, callback) {
	stdin.setRawMode(true)
	stdin.resume()
	stdin.setEncoding('utf8')

	message = message + ( _default ? ' [yes]: ' : ' [no]: ')
	process.stdout.write(message)
	var keyLog = []
	stdin.on('data', function keyCallback(key) {
		if (key == '\u0003') {// ctrl-c
			process.exit()
		} else if (key == '\u000D') {
			stdin.pause()
			stdin.removeListener('data', keyCallback)
			console.log('')
			if (keyLog.length === 0) {
				if (callback) {
					callback(_default)
				}
			} else if (callback) {
				var resp = keyLog.join('').toLowerCase()
				if (resp === 'yes' || resp == 'y') {
					callback(true)
				} else if (resp === 'no' || resp == 'n') {
					callback(false)
				} else {
					callback(false)
				}
			}
		} else if (key === ' ') {
			if (keyLog.length === 0) {
				stdin.pause()
				stdin.removeListener('data', keyCallback)
				console.log('')
				if (callback) {
					callback(_default)
				}
			} else {
				process.stdout.write(key)
			}
		} else {
			keyLog.push(key)
			process.stdout.write(key)
		}
	})
}

function formatBlockName(block) {
	return block.getBlockType().name.capitalizeFirstLetter() + ' (' + block.getBlockId() + ')'
}

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1)
}
function exitWithError(err) {
	console.error(err)
	if (client) {
		client.disconnect(function() {
			process.exit(1)
		})
	} else {
		process.exit(1)
	}
}
