var args = process.argv
if (args.length !== 3) {
  console.log('Usage: node bin/upgrade PATH')
  process.exit(1)
}

var async = require('async')
var prompt = require('cli-prompt')
var cubelets = require('../index')
var Upgrade = require('../upgrade')

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
    prompt('Run compatibility check? [Y/n]\n', function (val) {
      if (val.toLowerCase() === 'y') {
        callback(true)
      } else {
        callback(false)
      }
    })
  }

  function runCompatibilityCheck(callback) {
    prompt('Attach all of your Cubelets. Then press enter.\n', function () {
      client.fetchAllBlocks(function (err) {
        if (err) {
          callback(err)
        } else {
          
        }
      })
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
