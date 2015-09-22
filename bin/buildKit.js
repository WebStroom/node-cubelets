var args = process.argv
if (args.length !== 3) {
  console.log('Usage: node bin/buildKit PATH')
  process.exit(1)
}

var device = {
  path: args[2]
}

var prompt = require('cli-prompt')
var cubelets = require('../index')
var Protocol = cubelets.Protocol
var Kit = require('../kit/index.js')
var SixKit = require('../kit/six')
var TwelveKit = require('../kit/twelve')
var TwentyKit = require('../kit/twenty')
var Block = require('../block')
var __ = require('underscore')
var KitService = require('../services/kit')

var kit = new Kit()
var kitService = new KitService()

var client = cubelets.connect(device, function (err) {
  if (err) {
    exitWithError(err)
  } else {
    console.log('Connected.')
    start(client)
  }
})
client.on('disconnect', function () {
  console.log('Disconnected.')
})
function start (client) {
  prompt('To detect a kit press any key and ENTER.\n', function (val) {
    client.sendRequest(new Protocol.messages.GetAllBlocksRequest(), function (err, response) {
      if (err) {
        exitWithError(err)
      }

      var blocks = []
      __.each(response.blocks, function (block) {
        blocks.push(new Block(block.blockId, block.hopCount, Block.blockTypeForId(block.blockType)))
      })
      printBlocksFound(blocks)

      if (blocks.length === 6) {
        validateSix(blocks)
      } else if (blocks.length === 12) {
        validateTwelve(blocks)
      } else if (blocks.length === 20) {
        validateTwenty(blocks)
      } else {
        console.log('No valid kit was detected:')
        validateSix(blocks)
        validateTwelve(blocks)
        validateTwenty(blocks)
        start(client)
      }
    })
  })
}

function validateSix (blocks) {
  var expectedKit = new SixKit()
  validateKit(blocks, expectedKit)
}

function validateTwelve (blocks) {
  var expectedKit = new TwelveKit()
  validateKit(blocks, expectedKit)
}

function validateTwenty (blocks) {
  var expectedKit = new TwentyKit()
  validateKit(blocks, expectedKit)
}

function validateKit (blocks, expectedKit) {
  kit.verifyKit(expectedKit, blocks, function (isValid, missing, extra) {
    if (isValid) {
      askToBuildKit(expectedKit, blocks)
    } else {
      kitVerificationFailure(expectedKit, blocks, missing, extra)
    }
  })
}

function printBlocksFound (blocks) {
  console.log('Blocks Found:')
  __.each(blocks, function (block) {
    console.log('  ' + formatBlockName(block))
  })
  console.log('')
}

function askToBuildKit (type, blocks) {
  prompt.multi([{
    label: 'This appears to be a valid ' + type.name + '. \nDo you want to complete the kit?',
    key: 'submit',
    default: 'yes'
  }], function (val) {
    if (val['submit'] && (val['submit'].toLowerCase() === 'yes' || val['submit'].toLowerCase() === 'y')) {
      kitService.buildKit(blocks, function (err, kitId) {
        if (err) {
          exitWithError(err)
        }
        console.log('Successfully added kit to datastore: ' + kitId)
        console.log('')
        console.log('')
        start(client)
      })

    } else {
      console.log('')
      console.log('')
      start(client)
    }
  })

}

function kitVerificationFailure (type, blocks, missing, extra) {
  console.log('')
  console.log('Invalid ' + type.name + ' Kit:')
  if (missing.length > 0) {
    console.log('  Misssing:')
    __.each(missing, function (block) {
      console.log('    ' + block.name.capitalizeFirstLetter())
    })
  }
  if (extra.length > 0) {
    console.log('  Extra:')
    __.each(extra, function (block) {
      console.log('    ' + block.name.capitalizeFirstLetter())
    })
  }
  console.log('')
}

function formatBlockName (block) {
  return block.getBlockType().name.capitalizeFirstLetter() + ' (' + block.getBlockId() + ')'
}

String.prototype.capitalizeFirstLetter = function () {
  return this.charAt(0).toUpperCase() + this.slice(1)
}
function exitWithError (err) {
  console.error(err)
  if (client) {
    client.disconnect(function () {
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
}
