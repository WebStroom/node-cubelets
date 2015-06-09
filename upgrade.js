var fs = require('fs')
var path = require('path')
var async = require('async')
var xtend = require('xtend')
var cubelets = require('./client/net')
var Protocol = cubelets.Protocol
var Cubelet = require('./cubelet')
var Types = Cubelet.Types
var Program = require('./program')
var InfoService = require('./service/info')

var bluetoothSerialDevice = {
  WCC: { address: "00-04-3e-08-21-d1", channelID: 1 },
  GPW: { address: "00-04-3e-08-21-db", channelID: 1 }
}

var netDevice = {
  port: 9000
}

var device = netDevice

var FirmwareType = {
  CLASSIC: 0,
  BOOTSTRAP: 1,
  IMAGO: 2
}

var programs = {}

function loadProgram(blockType) {
  var typeID = blockType.id
  //XXX: path to actual hex programs
  // var file = path.join('./upgrade/programs/', blockType.name + '.hex')
  var data = fs.readFileSync('./upgrade/program.hex')
  programs[typeID] = new Program(data)
}

loadProgram(Types.BARGRAPH)
loadProgram(Types.BATTERY)
loadProgram(Types.BATTERY_LIPO)
loadProgram(Types.BLOCKER)
loadProgram(Types.BRIGHTNESS)
loadProgram(Types.DISTANCE)
loadProgram(Types.DRIVE)
loadProgram(Types.FLASHLIGHT)
loadProgram(Types.INVERSE)
loadProgram(Types.KNOB)
loadProgram(Types.MAXIMUM)
loadProgram(Types.MINIMUM)
loadProgram(Types.PASSIVE)
loadProgram(Types.THRESHOLD)
loadProgram(Types.ROTATE)
loadProgram(Types.SPEAKER)
loadProgram(Types.TEMPERATURE)

// 1: detect bluetooth cubelet type:
//     - imago
//     - bootstrap
//     - classic
// 2: flash bluetooth with bootstrap
// 3: attach next classic cubelet
// 4. flash classic cubelet with imago
// 5. detatch imago cubelet
// 6. if another classic cubelet goto 3
// 7. flash bluetooth with imago

var done = false

function detectFirmwareType(client, callback) {
  console.log('detect firmware type')
  client.setProtocol(Protocol.Classic)
  client.ping(function (err) {
    if (!err) {
      callback(null, FirmwareType.CLASSIC)
    } else {
      client.setProtocol(Protocol.Imago)
      client.fetchConfiguration(function (err, config) {
        if (!err) {
          callback(null,
            (config.customApplication === 2) ? 
              FirmwareType.BOOTSTRAP : FirmwareType.IMAGO)
        } else {
          callback(err)
        }
      })
    }
  }, 1000)
}

function flashBootstrapIfNeeded(client, callback) {
  detectFirmwareType(client, function (err, firmwareType) {
    if (err) {
      console.error('could not detect firmware')
    } else if (FirmwareType.BOOTSTRAP !== firmwareType) {
      console.log('flashing bootstrap')
      flashBootstrap(client, callback)
    } else {
      console.log('skipping bootstrap')
      callback(null, client)
    }
  })
}

function flashBootstrap(client, callback) {
  console.log('(flash bootstrap not implemented)')
  callback(null, client)
}

function queueBlocksUntilDone(client, callback) {
  console.log('queue blocks until done')
  var waitingQueue = []
  var doneQueue = []

  function enqueue(q, block) {
    q.unshift(block)
  }

  function peek(q) {
    return q.slice(-1)[0]
  }

  function dequeue(q) {
    return q.pop()
  }

  function exists(q, block) {
    return q.indexOf(block) > -1
  }

  function empty(q) {
    return q.length === 0
  }

  function fetchNeighborBlocks(callback) {
    console.log('fetch neighbor blocks')
    client.fetchNeighborBlocks(function (err, blocks) {
      if (err) {
        callback(err)
      } else {
        fetchBlockInfo(blocks, callback)
      }
    })
  }

  function fetchBlockInfo(blocks, callback) {
    var service = new InfoService()
    service.on('info', function (info, block) {
      var type = Cubelet.typeForTypeID(info.typeID)
      if (type !== Types.UNKNOWN) {
        block.type = type
        if (!exists(waitingQueue, block) && !exists(doneQueue, block)) {
          enqueue(waitingQueue, block)
          console.log('waiting:', waitingQueue)
        }
      }
    })
    service.fetchCubeletInfo(blocks, function (err) {
      service.removeAllListeners('info')
      callback(err)
    })
  }

  function flashNextBlock(callback) {
    var block = peek(waitingQueue)
    var typeID = block.type.id
    var program = programs[typeID]
    if (!program) {
      callback(new Error('No program found for block type: ' + typeID))
    } else {
      console.log('flashing block', block.id)
      client.flashProgramToBlock(program, block, function (err) {
        if (err) {
          callback(err)
        } else {
          enqueue(doneQueue, dequeue(waitingQueue))
          console.log('done:', doneQueue)
          callback(null)
        }
      })
    }
  }

  function wait(callback) {
    var delay = 7500
    console.log('waiting', delay+'ms')
    setTimeout(function () {
      callback(null)
    }, 5000)
  }

  function tryFlashNextBlock(callback) {
    if (empty(waitingQueue)) {
      console.log('no blocks to flash')
      wait(callback)
    } else {
      console.log('flashing next block')
      flashNextBlock(callback)
    }
  }

  async.until(function () {
    return done
  }, function (next) {
    async.series([
      fetchNeighborBlocks,
      tryFlashNextBlock
    ], next)
  }, callback)
}

function flashImago(client, callback) {
  console.log('flash imago')
  callback(null, client)
}

function update(client, callback) {
  console.log('update')
  async.seq(
    flashBootstrapIfNeeded,
    queueBlocksUntilDone,
    flashImago
  )(client, callback)

  this.done = function () {
    done = true
  }
}

var client = cubelets.connect(device, function (err) {
  if (err) {
    console.error(err)
  } else {
    update(client, function (err) {
      client.disconnect()
      if (err) {
        console.error(err)
      } else {
        console.log('update successful')
      }
    })
  }
})
