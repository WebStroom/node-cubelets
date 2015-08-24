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
var CompatibilityCheck = require('../upgrade/compatibilityCheck')
var InfoService = require('../services/info')
var __ = require('underscore')

var device = {
  path: args[2]
}

var client = cubelets.connect(device, function (err) {
  if (err) {
    exitWithError(err)
  } else {
    start(client)
  }
})

function start(client) {
  askYesOrNo('Run compatibility check?',
    runCompatibilityCheck,
    runUpgrade)

  function runCompatibilityCheck() {
    var check = new CompatibilityCheck(client)
    prompt('Attach all of your Cubelets. Then press ENTER.', function () {
      check.on('found', function (blocks) {
        console.log('Found', formatNumber(blocks.length), 'blocks. Checking compatibility...')
      })
      check.on('notCompatible', function (block) {
        console.log('𐄂', 'Block', formatBlockName(block), 'is NOT compatible.')
      })
      check.on('compatible', function (block) {
        console.log('✓', 'Block', formatBlockName(block), 'is compatible.')
      })
      check.start(function (err) {
        prompt([
          'Attach more Cubelets directly to the Bluetooth block,',
          'or press ENTER to finish the check.'
        ].join(), function enter() {
          check.finish()
          var compatible = check.getCompatible().length
          var notCompatible = check.getNotCompatible().length
          if (compatible === 0) {
            console.log([
              'It looks like none of your Cubelets are compatible with OS4.',
              'Visit modrobotics.com/sustainability to learn about',
              'our Cubelet upgrade recycling program.'
            ].join())
            exitWithSuccess('Upgrade canceled.')
          } else if (notCompatible > 0) {
            askYesOrNo([
              'It looks like ' + formatNumber(notCompatible) + ' of your Cubelets ',
              'are compatible with OS4. Do you want to continue the upgrade anyway?'
            ].join(), function yes() {
              runUpgrade()
            }, function no() {
              exitWithSuccess('Upgrade canceled. Goodbye.')
            })
          } else {
            askYesOrNo([
              'All of your Cubelets are compatible with OS4?',
              'Ready to upgrade your Cubelets?'
            ].join(), function yes() {
              runUpgrade()
            }, function no() {
              exitWithSuccess('Upgrade canceled. Goodbye.')
            })
          }
        })
      })
    })
  }

  function runUpgrade() {
    var upgrade = new Upgrade(client)
    upgrade.on('progress', function (e) {
      var pct = Math.floor(100.0 * e.progress / e.total)
      console.log(e.action ? e.action : '', pct + '%')
    })
    upgrade.on('flashBootstrapToHostBlock', function (hostBlock) {
      console.log('Flashing Cubelets OS4 bootstrap firmware to the Bluetooth block...')
    })
    upgrade.on('needToDisconnect', function () {
      console.log('To continue the upgrade, reset power on your Cubelets by switching the Battery Cubelet off then on.')
    })
    upgrade.on('needToConnect', function () {
      console.log('Attempting to reconnect to Cubelets...')
      setTimeout(tryReconnect, 5000)
    })
    function tryReconnect() {
      async.retry({ times: 5, interval: 5000 }, function (callback) {
        client.connect(device, callback)
      }, function (err) {
        if (err) {
          exitWithError(new Error('Could not reconnect.'))
        }
      })
    }
    upgrade.on('flashBootstrapToBlock', function (block) {
      console.log('Flashing Cubelets OS4 bootstrap firmware to block', formatBlockName(block) + '...')
    })
    upgrade.on('flashUpgradeToBlock', function (block) {
      console.log('Flashing Cubelets OS4 firmware to block', formatBlockName(block) + '...')
    })
    upgrade.on('completedBlock', function (block) {
      console.log('Successfully upgraded block', formatBlockName(block), 'to OS4.')
      var pending = upgrade.getPendingBlocks().count
      if (pending === 0) {
        promptContinueOrFinish()
      } else {
        console.log('There are', formatNumber(pending), 'pending blocks to upgrade.')
      }
    })
    upgrade.on('noPendingBlocks', function () {
      console.log('No pending blocks found.')
      promptContinueOrFinish()
    })
    function promptContinueOrFinish() {
      prompt([
        'Attach more Cubelets directly to the Bluetooth block,',
        'or press ENTER if you are done upgrading all of your Cubelets.'
      ].join(), function () {
        upgrade.finish()
      })
    }
    upgrade.on('flashUpgradeToHostBlock', function () {
      console.log('Flashing Cubelets OS4 firmware to the Bluetooth block...')
    })
    upgrade.on('completedHostBlock', function () {
      console.log('Successfully upgraded Bluetooth block.')
    })
    upgrade.on('complete', function () {
      exitWithSuccess('Cubelets OS4 updgrade complete.')
    })
    upgrade.on('error', function onError(err) {
      console.error('Upgrade failed:\n\t', err)
      askYesOrNo('Retry?', function yes() {
        process.nextTick(runUpgrade)
      }, function no() {
        exitWithError(err)
      })
    })
    upgrade.start(function (err) {
      if (err) {
        exitWithError(err)
      }
    })
  }
}

function askYesOrNo(text, yesCallback, noCallback) {
  prompt(text + ' [Y/n] ', function (val) {
    (val.toLowerCase() === 'y' ?
      yesCallback : noCallback)()
  })
}

function formatNumber(n) {
  if (n === 0) return 'none'
  else if (n === 1) return 'one'
  else if (n === 2) return 'two'
  else if (n === 3) return 'three'
  else if (n === 4) return 'four'
  else return n
}

function formatBlockName(block) {
  return block.getBlockType().name + ' (' + block.getBlockId() + ')'
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
