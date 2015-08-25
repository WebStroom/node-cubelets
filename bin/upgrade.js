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
var InfoService = require('../services/info')
var __ = require('underscore')

var device = {
  path: args[2]
}

var client = cubelets.connect(device, function (err) {
  if (err) {
    exitWithError(err)
  } else {
    runUpgrade(client)
  }
})

function askYesOrNo(text, yesCallback, noCallback) {
  prompt(text + ' [Y/n] ', function (val) {
    (val.toLowerCase() === 'y' ?
      yesCallback : noCallback)()
  })
}

// 1. Ask for compatibility check
askYesOrNo('Run compatibility check?', function yes() {

}, function no() {

}})
  // Yes: Run check
    // Display results
    // Ask if continue
      // Yes: Goto 2.
      // No: Exit
  // No: Skip to flash bootstrap
// 2. Flash bootstrap
function flashBootstrap() {

}
// 3. Wait for disconnect
  // Ok: Goto 5.
  // Fail: Goto 4.
// 4. Request disconnect
  // Ask user to reset power
  // Goto 3.
// 5. Wait for reconnect
  // Ok: Goto 7.
  // Fail: Goto 6.
// 6. Request reconnect
  // Ask user to power on and connect
  // Goto 5.
// 7. Start Discovery
  // Queue face->{OS, timestamp}
  // Remove from queue if timestamp > now - 800ms
  // If count OS3 blocks > 0 Goto 8.
  // Else if OS4 blocks > 0 Goto X.
  // Else
    // Ask if done
    // Wait 2s
// 8. Jump to OS3
  // Fetch neighbor blocks
  // If count neighbor blocks > 0, Goto 9.
  // Else Goto 7.
// 9. Pick OS3 target
// 10. Fetch target block info
  // If not compatible, show error
  // Else Goto 10.
// 11. Flash target OS4 bootstrap
  // Ok: Goto 11.
  // Fail: 
// 12. Jump to discovery
// 13. Discover an OS4 target
// 14. Jump to OS4
// 15. Pick OS4 target
// 16. Flash target OS4 application
// 17. Jump to discovery
// 18. Verify target in application mode
// 19.  

// X. Jump to OS4
  // Fetch neighbor blocks
  // ...

function runUpgrade(client) {
  var upgrade = new Upgrade(client)

  upgrade.detectIfNeeded(function (err, needsUpgrade) {
    if (err) {
      exitWithError(err)
    } else if (needsUpgrade) {
      console.log('An upgrade is required.')
      // First, ask the user if they want to run a compatibility check.
      promptRunCompatibilityCheck(function (yes) {
        if (yes) {
          runCompatibilityCheck(function (err, result) {
            if (err) {
              exitWithError(err)
            } else {
              if (result.notCompatibleBlocks.lenth === 0) {
                prompt('All of your Cubelets are compatible. Proceed with upgrade? [Y/n]', function (val) {
                  if (val.toLowerCase() === 'y') {
                    enterBootstrapBluetoothBlock()
                  } else {
                    exitWithSuccess('Goodbye.')
                  }
                })
              }
            }
          })
        } else {
          enterBootstrapBluetoothBlock()
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
        var type = Block.blockTypeForId(info.blockTypeId)
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
          callback(null, {
            compatibleBlocks: compatibleBlocks,
            notCompatibleBlocks: notCompatibleBlocks
          })
        }
      })
    }
  }

  function enterBootstrapBluetoothBlock() {
    bootstrapBluetoothBlock(function (err) {
        // HERE

    })
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
