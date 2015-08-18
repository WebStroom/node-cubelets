var args = process.argv
if (args.length !== 3) {
  console.log('Usage: node bin/upgrade PATH')
  process.exit(1)
}

var async = require('async')
var prompt = require('cli-prompt')
var cubelets = require('../index')
var Block = require('../block')
var BlockTypes = require('../blockTypes')
var Upgrade = require('../upgrade')
var InfoService = require('../service/info')
var __ = require('underscore')

var device = {
  path: args[2]
}

var client = cubelets.connect(device, function (err) {
  if (err) {
    exitWithError(err)
  } else {
    startUpgrade(client)
  }
})

function startUpgrade(client) {
  var upgrade = new Upgrade(client)

  upgrade.detectIfNeeded(function (err, needsUpgrade) {
    if (err) {
      exitWithError(err)
    } else if (needsUpgrade) {
      console.log('An upgrade is required.')

      // First, ask the user if they want to run a compatibility check.
      promptRunCompatibilityCheck(function (yes) {
        if (yes) {
          runCompatibilityCheck(function (err) {
            if (err) {
              exitWithError(err)
            } else {
              // TODO
              exitWithSuccess('Ran compatibility check.')
            }
          })
        } else {
          exitWithSuccess('Did not run compatibility check.')
          /*
          bootstrapBluetoothBlock(function (err) {
            if (err) {
              exitWithError(err)
            } else {
              // TODO
              exitWithError('Bootstrapped Bluetooth block.')
            }
          })
          */
        }
      })
    } else {
      exitWithSuccess('Upgrade not needed.')
    }
  })

  function promptRunCompatibilityCheck(callback) {
    prompt('Run compatibility check? [Y/n]', function (val) {
      if (val.toLowerCase() === 'y') {
        callback(true)
      } else {
        callback(false)
      }
    })
  }

  function runCompatibilityCheck(callback) {
    var unknownBlocks = []
    var compatibleBlocks = []
    var notCompatibleBlocks = []

    client.getBlockMap().on('addBlock', onAddBlock)

    function onAddBlock(block) {
      unknownBlocks.push(block)
    }

    prompt('Attach all of your Cubelets. Then press enter.', function () {
      checkBlocks(callback)
    })

    function checkBlocks(callback) {
      console.log('Finding blocks...')
      client.fetchAllBlocks(function (err, blocks) {
        console.log('Found', blocks.length, 'blocks. Checking compatibility...')
        if (err) {
          callback(err)
        } else {
          unknownBlocks = filterUnknownBlocks(blocks)
          fetchUnknownBlockTypes(function (err) {
            if (err) {
              callback(err)
            } else {
              printCompatibilityResults()
              promptCheckMoreBlocks(callback)
            }
          })
        }
      })
    }

    function filterUnknownBlocks(blocks) {
      return __(blocks).filter(function (block) {
        return block.getBlockType() === BlockTypes.UNKNOWN
      })
    }

    function fetchUnknownBlockTypes(callback) {
      var service = new InfoService()

      service.on('info', function (info, block) {
        var type = Block.typeForTypeId(info.blockTypeId)
        if (type !== BlockTypes.UNKNOWN) {
          block._blockType = type
          unknownBlocks = __(unknownBlocks).without(block)
          sortByCompatibility(block, info)
        }
      })

      service.fetchBlockInfo(unknownBlocks, function (err) {
        service.removeAllListeners('info')
        callback(err)
      })
    }

    function sortByCompatibility(block, info) {
      if (info.mcuString === 'avr') {
        notCompatibleBlocks.push(block)
      } else {
        compatibleBlocks.push(block)
      }
    }

    function printBlock(isCompatible, block) {
      console.log(isCompatible ? '✓':'𐄂', block.getBlockId(), block.getBlockType().name)
    }

    function printCompatibilityResults() {
      if (notCompatibleBlocks.length > 0) {
        console.log('Not compatible with OS4:')
        __(notCompatibleBlocks).each(printBlock.bind(this, false))
      }
      if (compatibleBlocks.length > 0) {
        console.log('Compatible with OS4:')
        __(compatibleBlocks).each(printBlock.bind(this, true))
      }
    }

    function promptCheckMoreBlocks(callback) {
      prompt('Check more blocks? [Y/n]', function (val) {
        if (val.toLowerCase() === 'y') {
          process.nextTick(function () {
            checkBlocks(callback)
          })
        } else {
          client.getBlockMap().removeListener('addBlock', onAddBlock)
          callback(null)
        }
      })
    }
  }

  function bootstrapBluetoothBlock(callback) {
    async.series([
      upgrade.bootstrapBluetoothBlock,
      upgrade.waitForDisconnect,
      upgrade.waitForReconnect
    ], callback)
  }
}

function exitWithError(err) {
  console.error(err)
  if (client) {
    client.disconnect(function () {
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
}

function exitWithSuccess(msg) {
  console.log(msg)
  process.exit(0)
}
