var util = require('util')
var events = require('events')
var async = require('async')
var xtend = require('xtend')
var cubelets = require('./client/net')
var ClassicProtocol = require('./protocol/classic')
var ImagoProtocol = require('./protocol/imago')
var BootstrapProtocol = require('./protocol/bootstrap/upgrade')
var Block = require('./block')
var BlockTypes = require('./blockTypes')
var Program = require('./program')
var InfoService = require('./services/info')
var __ = require('underscore')

var FirmwareType = {
  CLASSIC: 0,
  IMAGO: 1,
  BOOTSTRAP: 2
}

var programs = {}

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
  // Switch to the classic protocol
  client.setProtocol(ClassicProtocol)
  // Send a keep alive request to test how the cubelet responds
  client.sendRequest(new ClassicProtocol.messages.KeepAliveRequest(), function (err, response) {
    if (err) {
      // The imago protocol will fail to respond.
      client.setProtocol(ImagoProtocol)
      callback(null, FirmwareType.IMAGO)
    }
    else if (response.payload.length > 0) {
      // The bootstrap protocol will differentiate itself by
      // sending an extra byte in the response.
      client.setProtocol(BootstrapProtocol)
      callback(null, FirmwareType.BOOTSTRAP)
    } else {
      // Otherwise, the cubelet has classic firmware.
      callback(null, FirmwareType.CLASSIC)
    }
  })
}

function flashBootstrapIfNeeded(client, callback) {
  detectFirmwareType(client, function (err, firmwareType) {
    if (err) {
      callback(err)
    } else if (FirmwareType.BOOTSTRAP !== firmwareType) {
      flashBootstrap(client, callback)
    } else {
      callback(null, client)
    }
  })
}

function flashBootstrap(client, callback) {
  callback(null, client)
}

function queueBlocksUntilDone(client, callback) {
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
      var type = Block.blockTypeForId(info.blockTypeId)
      if (type !== BlockTypes.UNKNOWN) {
        block._blockType = type
        if (!exists(waitingQueue, block) && !exists(doneQueue, block)) {
          enqueue(waitingQueue, block)
        }
      }
    })
    service.fetchBlockInfo(blocks, function (err) {
      service.removeAllListeners('info')
      callback(err)
    })
  }

  function flashNextBlock(callback) {
    var block = peek(waitingQueue)
    var typeId = block.type.typeId
    var program = programs[typeId]
    if (!program) {
      callback(new Error('No program found for block type: ' + typeId))
    } else {
      client.flashProgramToBlock(program, block, function (err) {
        if (err) {
          callback(err)
        } else {
          enqueue(doneQueue, dequeue(waitingQueue))
          callback(null)
        }
      })
    }
  }

  function wait(callback) {
    var delay = 7500
    setTimeout(function () {
      callback(null)
    }, 5000)
  }

  function tryFlashNextBlock(callback) {
    if (empty(waitingQueue)) {
      wait(callback)
    } else {
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
  callback(null, client)
}

function update(client, callback) {
  async.seq(
    flashBootstrapIfNeeded,
    queueBlocksUntilDone,
    flashImago
  )(client, callback)

  this.done = function () {
    done = true
  }
}

var Upgrade = function (client) {
  events.EventEmitter.call(this)

  var self = this

  this.getClient = function () {
    return client
  }

  this.detectIfNeeded = function (callback) {
    detectFirmwareType(client, function (err, firmwareType) {
      if (err) {
        callback(err)
      } else {
        callback(null, (FirmwareType.IMAGO !== firmwareType), firmwareType)
      }
    })
  }

  this.bootstrapBluetoothBlock = function (callback) {
    var p = 0
    var interval = setInterval(function () {
      if (p > 100) {
        clearInterval(interval)
        callback(null)
      } else {
        self.emit('progress', ((p++) / 100.0))
      }
    }, 10)
  }

  this.waitForDisconnect = function (callback) {
    callback(null)
  }

  this.waitForReconnect = function (callback) {
    callback(null)
  }

  var pendingBlocks = []
  var completedBlocks = []
  var activeBlock = null

  function findPendingBlock(block) {
    return __(pendingBlocks).find(function (pendingBlock) {
      return block.getBlockId() === pendingBlock.getBlockId()
    })
  }

  function findCompletedBlock(block) {
    return __(completedBlocks).find(function (completedBlock) {
      return block.getBlockId() === completedBlock.getBlockId()
    })
  }

  function filterUnknownPendingBlocks() {
    return __(pendingBlocks).filter(function (block) {
      return block.getBlockType() === BlockTypes.UNKNOWN
    })
  }

  function fetchUnknownBlockTypes(callback) {
    var unknownBlocks = filterUnknownPendingBlocks()
    var service = new InfoService()
    var changed = false
    service.on('info', function (info, block) {
      var type = Block.blockTypeForId(info.blockTypeId)
      if (type !== BlockTypes.UNKNOWN) {
        block._blockType = type
        changed = true
      }
    })
    service.fetchBlockInfo(unknownBlocks, function (err) {
      service.removeAllListeners('info')
      callback(err)
      if (changed) {
        self.emit('changePendingBlocks')
      }
    })
  }

  function dequeueNextBlockToUpgrade() {
    var index = __(pendingBlocks).findIndex(function (block) {
      return block.getBlockType() !== BlockTypes.UNKNOWN
    })
    if (index > -1) {
      var nextBlock = pendingBlocks[index]
      pendingBlocks.splice(index, 1)
      self.emit('changePendingBlocks')
      return nextBlock
    }
  }

  function findBlocksToUpgrade(callback) {
    client.fetchAllBlocks(function (err) {
      if (err) {
        callback(err)
      } else {
        __(client.getAllBlocks()).each(function (block) {
          if (!findPendingBlock(block) && !findCompletedBlock(block)) {
            pendingBlocks.push(block)
            self.emit('changePendingBlocks')
          }
        })
        callback(null)
      }
    })
  }

  function waitForUserInput(t) {
    return function (callback) {
      setTimeout(callback, t)
    }
  }

  var done = false

  this.startBlockUpgrades = function (callback) {
    async.until(function () {
      return done
    }, function (next) {
      async.series([
        findBlocksToUpgrade,
        fetchUnknownBlockTypes,
        upgradeNextBlock,
        waitForUserInput(1000)
      ], next)
    }, function (err) {
      if (callback) {
        callback(err)
      }
    })
  }

  function upgradeNextBlock (callback) {
    var nextBlock = dequeueNextBlockToUpgrade()
    if (nextBlock) {
      activeBlock = nextBlock
      self.emit('changeActiveBlock')
      var p = 0
      var interval = setInterval(function () {
        if (p > 100) {
          clearInterval(interval)
          completedBlocks.push(activeBlock)
          self.emit('changeCompletedBlocks')
          if (callback) {
            callback(null)
          }
        } else {
          self.emit('progress', ((p++) / 100.0))
        }
      }, 10)
    } else {
      activeBlock = null
      self.emit('changeActiveBlock')
      if (callback) {
        callback(null)
      }
    }
  }

  this.getPendingBlocks = function () {
    return pendingBlocks
  }

  this.getActiveBlock = function () {
    return activeBlock
  }

  this.getCompletedBlocks = function () {
    return completedBlocks
  }

  this.stopBlockUpgrades = function () {
    done = true
  }

  this.upgradeBluetoothBlock = function (callback) {
    var p = 0
    var interval = setInterval(function () {
      if (p > 100) {
        clearInterval(interval)
        if (callback) {
          callback(null)
        }
      } else {
        self.emit('progress', ((p++) / 100.0))
      }
    }, 10)
  }

}

util.inherits(Upgrade, events.EventEmitter)

module.exports = Upgrade
