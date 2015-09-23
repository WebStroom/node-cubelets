var args = process.argv
if (args.length !== 3) {
	console.log('Usage: node bin/idFetchTypeChange PATH')
	process.exit(1)
}

var device = {
	path : args[2]
}

var cubelets = require('../index')
var Protocol = cubelets.Protocol
var Block = require('../block')
var __ = require('underscore')

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
	promptForAnyKey('To detect a Cubelets press any key.\n', function() {
		client.sendRequest(new Protocol.messages.GetAllBlocksRequest(), function(err, response) {
			if (err) {
				exitWithError(err)
			}

			var blocks = []
			__.each(response.blocks, function(block) {
				blocks.push(new Block(block.blockId, block.hopCount, Block.blockTypeForId(block.blockType)))
			})
			printBlocksFound(blocks)

			if (blocks.length === 0) {
				console.log("No Cubelets were detected.")
			} else if (blocks.length === 1) {
				console.log(blocks)
				//askToChangeCubeletType()
			} else {
				console.log("To switch a Cubelets type, please attach just that Cubelet.")
			}
		})
	})
}


function printBlocksFound(blocks) {
	console.log('Blocks Found:')
	__.each(blocks, function(block) {
		console.log('  ' + formatBlockName(block))
	})
	console.log('')
}

function askToChangeCubeletType(id, callback) {
	promptYesOrNo('Would you like to change the block type for '+id+'?', true, function(val) {
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
					callback()
				}
			})
		} else {
			console.log('')
			console.log('')
			if (callback) {
				callback()
			}
		}
	})
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
					callback(_default)
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
