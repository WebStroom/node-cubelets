var assert = require('assert')
var util = require('util')
var events = require('events')
var async = require('async')
var ClassicProtocol = require('../protocol/classic')
var ClassicProgram = ClassicProtocol.Program
var ClassicFlash = ClassicProtocol.Flash
var ImagoProtocol = require('../protocol/imago')
var ImagoProgram = ImagoProtocol.Program
var ImagoFlash = ImagoProtocol.Flash
var UpgradeProtocol = require('../protocol/bootstrap/upgrade')
var Block = require('../block')
var BlockTypes = require('../blockTypes')
var InfoService = require('../services/info')
var __ = require('underscore')

var FirmwareType = {
  CLASSIC: 0,
  IMAGO: 1,
  BOOTSTRAP: 2
}

var Upgrade = function (client) {
  var self = this
  events.EventEmitter.call(this)

  var running = false
  var finished = false
  var hostBlock = null
  var targetFaces = {}
  var pendingBlocks = []
  var completedBlocks = []
  var targetBlock = null

  this.detectIfNeeded = function (callback) {
    detectFirmwareType(function (err, firmwareType) {
      if (err) {
        callback(err)
      } else {
        callback(null, (FirmwareType.IMAGO !== firmwareType), firmwareType)
      }
    })
  }

  function detectFirmwareType(callback) {
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
        client.setProtocol(UpgradeProtocol)
        callback(null, FirmwareType.BOOTSTRAP)
      } else {
        // Otherwise, the cubelet has classic firmware.
        callback(null, FirmwareType.CLASSIC)
      }
    })
  }

  this.start = function (callback) {
    if (running) {
      callback(new Error('Upgrade already started.'))
    } else {
      running = true
      finished = false
      async.series([
        jumpToClassic,
        discoverHostBlock,
        flashBootstrapToHostBlockIfNeeded,
        startBlockUpgrades
      ], callback)
    }
  }

  function discoverHostBlock(callback) {
    assert.equal(client.getProtocol(), ClassicProtocol, 'Must be in OS3 mode.')
    var req = new ClassicProtocol.messages.GetNeighborBlocksRequest()
    client.sendRequest(req, function (err, res) {
      if (err) {
        callback(err)
      } else {
        var originBlockId = res.originBlockId
        if (originBlockId > 0) {
          hostBlock = new Block(originBlockId, 0, BlockTypes.BLUETOOTH)
          hostBlock._mcuType = MCUTypes.AVR
          callback(null)
        } else {
          callback(new Error('Host block not found.'))
        }
      }
    })
  }

  function flashBootstrapToHostBlockIfNeeded(callback) {
    detectFirmwareType(function (err, firmwareType) {
      if (err) {
        callback(err)
      } else if (FirmwareType.CLASSIC === firmwareType) {
        flashBootstrapToHostBlock(callback)
      } else {
        callback(null)
      }
    })
  }

  function flashBootstrapToHostBlock(callback) {
    assert.equal(client.getProtocol(), ClassicProtocol, 'Must be in OS3 mode.')
    var hex = fs.readFileSync('./upgrade/hex/bluetooth_bootstrap.hex')
    var program = new ClassicProgram(hex)
    if (program.valid) {
      self.emit('flashBootstrapToHostBlock', hostBlock)
      var flash = new ClassicFlash(client, {
        skipSafeCheck: true
      })
      flash.programToBlock(program, hostBlock, function (err) {
        flash.removeListener('progress', onProgress)
        if (err) {
          callback(err)
        } else {
          client.setProtocol(UpgradeProtocol)
          async.detect([
            detectSkipReset,
            detectReset
          ], function (detector, callback) {
            detector(callback)
          }, function (result) {
            if (result) {
              callback(null)
            } else {
              callback(new Error('Block failed to reset after boostrap.'))
            }
          })
        }
      })
      flash.on('progress', onProgress)
      function onProgress(e) {
        self.emit('progress', e)
      }
    } else {
      callback(new Error('Program invalid.'))
    }
  }

  function detectSkipReset(callback) {
    client.on('event', onSkipDisconnectEvent)
    function onSkipDisconnectEvent(e) {
      if (e instanceof UpgradeProtocol.messages.SkipDisconnectEvent) {
        client.removeListener('event', onSkipDisconnectEvent)
        callback(true)
      }
    }
    setTimeout(function () {
      client.removeListener('event', onSkipDisconnectEvent)
      callback(false)
    })
  }

  function detectReset(callback) {
    async.series([
      retry({ times: 5, interval: 5000 }, waitForDisconnect),
      retry({ times: 5, interval: 5000 }, waitForReconnect)
    ], function (err) {
      callback(err ? false : true)
    })
  }

  function waitForDisconnect(callback) {
    var timer = setTimeout(function () {
      client.removeListener('disconnect', onDisconnect)
      client.removeListener('event', onDisconnectFailedEvent)
      callback(new Error('Failed to disconnect.'))
    }, 5000)
    client.on('disconnect', onDisconnect)
    function onDisconnect() {
      client.removeListener('disconnect', onDisconnect)
      client.removeListener('event', onDisconnectFailedEvent)
      if (timer) {
        clearTimeout(timer)
        callback(null)
      } else {
        callback(new Error('Disconnected before flashing complete.'))
      }
    }
    client.on('event', onDisconnectFailedEvent)
    function onDisconnectFailedEvent(e) {
      if (e instanceof UpgradeProtocol.messages.DisconnectFailedEvent) {
        self.emit('needToDisconnect')
      }
    }
  }

  function waitForReconnect(callback) {
    var timer = setTimeout(function () {
      client.removeListener('connect', onConnect)
      callback(new Error('Failed to reconnect.'))
    }, 5000)
    client.on('connect', onConnect)
    function onConnect() {
      client.removeListener('connect', onConnect)
      if (timer) {
        clearTimeout(timer)
        callback(null)
      }
    }
    self.emit('needToConnect')
  }

  this.getPendingBlocks = function () {
    return pendingBlocks
  }

  function enqueuePendingBlock(block) {
    if (!findPendingBlockById(block.getBlockId())) {
      pendingBlocks.unshift(block)
      self.emit('changePendingBlocks', pendingBlocks)
      return true
    } else {
      return false
    }
  }

  function dequeuePendingBlock() {
    var index = __(pendingBlocks).findIndex(function (block) {
      return block.getBlockType() !== BlockTypes.UNKNOWN
    })
    if (index > -1) {
      var nextBlock = pendingBlocks[index]
      pendingBlocks.splice(index, 1)
      self.emit('changePendingBlocks', pendingBlocks)
      return nextBlock
    }
  }

  this.getTargetBlock = function () {
    return targetBlock
  }

  function setTargetBlock(block) {
    targetBlock = block
    self.emit('changeTargetBlock', targetBlock)
  }

  this.getCompletedBlocks = function () {
    return completedBlocks
  }

  function enqueueCompletedBlock(block) {
    if (!findCompletedBlockById(block.getBlockId())) {
      completedBlocks.unshift(block)
      self.emit('completeBlock', block)
      self.emit('changeCompletedBlocks', completedBlocks)
      return true
    } else {
      return false
    }
  }

  function startBlockUpgrades(callback) {
    async.until(function () {
      return done
    }, function (next) {
      async.series([
        jumpToDiscovery,
        discoverTargetFaces,
        waitForFinish(2500)
      ], next)
    }, callback)
  }

  function jumpToClassic(callback) {
    var protocol = client.getProtocol()
    if (ClassicProtocol === protocol) {
      callback(null)
    } else if (UpgradeProtocol === protocol) {
      var req = new UpgradeProtocol.messages.SetBootstrapModeRequest(0)
      client.sendRequest(req, function (err, res) {
        if (err) {
          callback(err)
        } else if (res.mode !== 0) {
          callback(new Error('Failed to jump to OS3 mode.'))
        } else {
          client.setProtocol(ClassicProtocol)
          callback(null)
        }
      })
    } else {
      callback(new Error('Must not jump to OS3 mode from OS4 mode.'))
    }
  }

  function jumpToImago(callback) {
    var protocol = client.getProtocol()
    if (ImagoProtocol === protocol) {
      callback(null)
    } else if (UpgradeProtocol === protocol) {
      var req = new UpgradeProtocol.messages.SetBootstrapModeRequest(1)
      client.sendRequest(req, function (err, res) {
        if (err) {
          callback(err)
        } else if (res.mode !== 1) {
          callback(new Error('Failed to jump to OS4 mode.'))
        } else {
          client.setProtocol(ImagoProtocol)
          callback(null)
        }
      })
    } else {
      callback(new Error('Must not jump to OS4 mode from OS3 mode.'))
    }
  }

  function jumpToDiscovery(callback) {
    var protocol = client.getProtocol()
    if (UpgradeProtocol === protocol) {
      callback(null)
    } else {
      var ResetCommand = protocol.messages.ResetCommand
      client.sendCommand(new ResetCommand())
      setTimeout(function () {
        client.setProtocol(UpgradeProtocol)
        var timer = setTimeout(function () {
          client.removeListener('event', waitForBlockEvent)
          client.setProtocol(protocol)
          callback(new Error('Failed to jump to discovery mode.'))
        }, 2500)
        client.on('event', waitForBlockEvent)
        function waitForBlockEvent(e) {
          if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
            client.removeListener('event', waitForBlockEvent)
            if (timer) {
              clearTimeout(timer)
              callback(null)
            }
          }
        }
      }, 500)
    }
  }

  function discoverTargetFaces(callback) {
    assert.equal(client.getProtocol(), UpgradeProtocol, 'Must be in discovery mode.')
    targetFaces = {}
    client.on('event', onBlockFoundEvent)
    function onBlockFoundEvent(e) {
      if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
        var faceIndex = e.faceIndex
        var firmwareType = e.firmwareType
        targetFaces[faceIndex] = {
          firmwareType: firmwareType,
          timestamp: __.now()
        }
      }
    }
    pendingBlocks = []
    setTimeout(function () {
      client.removeListener('event', onBlockFoundEvent)
      var classicFaces = __(targetFaces).countBy(matchFaceByFirmwareType(0))
      var imagoFaces = __(targetFaces).countBy(matchFaceByFirmwareType(1))
      if (classicFaces.length > 0) {
        async.series([
          jumpToClassic,
          enqueuePendingClassicBlocks,
          fetchUnknownPendingBlockTypes,
          upgradeNextPendingClassicBlock
        ], callback)
      } else if (imagoFaces.length > 0) {
        async.series([
          jumpToImago,
          enqueuePendingImagoBlocks,
          fetchUnknownPendingBlockTypes,
          upgradeNextPendingImagoBlock
        ], callback)
      } else {
        callback(null)
      }
    }, 2500)
  }

  function enqueuePendingClassicBlocks(callback) {
    var protocol = client.getProtocol()
    assert.equal(protocol, ClassicProtocol, 'Must be in OS3 mode.')
    var req = protocol.messages.GetNeighborBlocksRequest()
    client.sendRequest(req, function (err, res) {
      if (err) {
        callback(err)
      } else {
        __(res.neighbors).each(function (blockId, faceIndex) {
          var block = new Block(blockId, 1, BlockTypes.UNKNOWN)
          block._faceIndex = parseInt(faceIndex, 10)
          enqueuePendingBlock(block)
        })
        callback(null)
      }
    })
  }

  function upgradeNextPendingClassicBlock(callback) {
    assert.equal(client.getProtocol(), ClassicProtocol, 'Must be in OS3 mode.')
    var nextBlock = dequeuePendingBlock()
    if (nextBlock) {
      setTargetBlock(targetBlock)
      async.series([
        flashBootstrapToTargetBlock,
        jumpToDiscovery,
        discoverTargetImagoBlock,
        jumpToImago,
        flashUpgradeToTargetBlock,
        checkTargetBlockComplete
      ], callback)
    } else {
      setTargetBlock(null)
      callback(null)
    }
  }

  function enqueuePendingImagoBlocks(callback) {
    var protocol = client.getProtocol()
    assert.equal(protocol, ImagoProtocol, 'Must be in OS4 mode.')
    var req = ImagoProtocol.messages.GetNeighborBlocksRequest()
    client.sendRequest(req, function (err, res) {
      if (err) {
        callback(err)
      } else {
        var getModeTasks = __(res.neighbors).map(function (blockId, faceIndex) {
          return function (callback) {
            var req = ImagoProtocol.Block.messages.GetConfigurationRequest(blockId)
            client.sendBlockRequest(req, function (err, res) {
              if (err) {
                callback(err)
              } else {
                // Only enqueue pending imago blocks if they are in bootloader.
                if (res.mode === 0 && !findPendingBlockById(blockId)) {
                  var block = new Block(blockId, 1, BlockTypes.UNKNOWN)
                  block._faceIndex = parseInt(faceIndex, 10)
                  enqueuePendingBlock(block)
                }
              }
            })
          }
        })
        async.series(getModeTasks, callback)
      }
    })
  }

  function upgradeNextPendingImagoBlock(callback) {
    assert.equal(client.getProtocol(), ImagoProtocol, 'Must be in OS4 mode.')
    var nextBlock = dequeuePendingBlock()
    if (nextBlock) {
      targetBlock = nextBlock
      self.emit('changeTargetBlock', targetBlock)
      async.series([
        flashUpgradeToTargetBlock,
        checkTargetBlockComplete
      ], callback)
    } else {
      targetBlock = null
      self.emit('changeTargetBlock', targetBlock)
      callback(null)
    }
  }

  function fetchUnknownPendingBlockTypes(callback) {
    var unknownBlocks = filterUnknownPendingBlocks()
    if (0 === unknownBlocks.length) {
      callback(null)
    } else {
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
  }

  function flashBootstrapToTargetBlock(callback) {
    assert.equal(client.getProtocol(), ClassicProtocol, 'Must be in OS3 mode.')
    assert(targetBlock, 'Target block must be set.')
    var blockType = targetBlock.getBlockType()
    var hex = fs.readFileSync('./upgrade/hex/pic_bootstrap/' + blockType.name + '_bootstrap.hex')
    var program = new ClassicProgram(hex)
    if (program.valid) {
      self.emit('flashBootstrapToTargetBlock', targetBlock)
      var flash = new ClassicFlash(client, {
        skipSafeCheck: true
      })
      flash.programToBlock(program, targetBlock, function (err) {
        flash.removeListener('progress', onProgress)
        callback(err)
      })
      flash.on('progress', onProgress)
      function onProgress(e) {
        self.emit('progress', e)
      }
    } else {
      callback(new Error('Program invalid.'))
    }
  }

  function discoverTargetImagoBlock(callback) {
    assert.equal(client.getProtocol(), UpgradeProtocol, 'Must be in discovery mode.')
    assert(targetBlock, 'Target block must be set.')
    var timer = setTimeout(function () {
      client.removeListener('event', onBlockFoundEvent)
      callback(new Error('Failed to discover target OS3 block.'))
    }, 5000)
    client.on('event', onBlockFoundEvent)
    function onBlockFoundEvent(e) {
      if (e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
        if (e.firmwareType === 1 && e.faceIndex === targetBlock.getFaceIndex()) {
          clearTimeout(timer)
          client.removeListener('event', onBlockFoundEvent)
          callback(null)
        }
      }
    }
  }

  function flashUpgradeToTargetBlock(callback) {
    assert.equal(client.getProtocol(), ImagoProtocol, 'Must be in OS4 mode.')
    assert(targetBlock, 'Target block must be set.')
    var blockType = targetBlock.getBlockType()
    var hex = fs.readFileSync('./upgrade/hex/applications/' + blockType.name + '.hex')
    var program = new ImagoProgram(hex)
    if (program.valid) {
      self.emit('flashUpgradeToTargetBlock', targetBlock)
      var flash = new ImagoFlash(client, {
        skipSafeCheck: true
      })
      flash.programToBlock(program, targetBlock, function (err) {
        flash.removeListener('progress', onProgress)
        callback(err)
      })
      flash.on('progress', onProgress)
      function onProgress(e) {
        self.emit('progress', e)
      }
    } else {
      callback(new Error('Program invalid.'))
    }
  }

  function checkTargetBlockComplete(callback) {
    assert(targetBlock, 'Target block must be set.')
    enqueueCompletedBlock(targetBlock)
    setTargetBlock(null)
    callback(null)
  }

  function matchFaceByFirmwareType(firmwareType) {
    return function (face) {
      return face.firmwareType === firmwareType
    }
  }

  function findTargetFaceIndexByFirmwareType(firmwareType) {
    var faceIndex = -1
    var keys = __(targetFaces).keys()
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i]
      var face = targetFaces[key]
      if (face.firmwareType === firmwareType) {
        faceIndex = parseInt(key, 10)
        break
      }
    }
    return faceIndex
  }

  function findPendingBlockById(blockId) {
    return __(pendingBlocks).find(function (pendingBlock) {
      return blockId === pendingBlock.getBlockId()
    })
  }

  function findCompletedBlockById(blockId) {
    return __(completedBlocks).find(function (completedBlock) {
      return blockId === completedBlock.getBlockId()
    })
  }

  function filterUnknownPendingBlocks() {
    return __(pendingBlocks).filter(function (block) {
      return block.getBlockType() === BlockTypes.UNKNOWN
    })
  }

  this.finish = function (callback) {
    if (running) {
      process.nextTick(function () {
        finished = true
      })
      self.on('finishBlockUpgrades', onFinishBlockUpgrades)
      function onFinishBlockUpgrades() {
        self.removeListener('finishBlockUpgrades', onFinishBlockUpgrades)
        async.series([
          flashUpgradeToHostBlock
        ], function (err) {
          if (err) {
            callback(err)
          } else {
            callback(null)
            self.emit('finish')
          }
        })
      }
    }
  }

  function flashUpgradeToHostBlock(callback) {
    assert.equal(client.getProtocol(), ClassicProtocol, 'Must be in OS3 mode.')
    var hex = fs.readFileSync('./upgrade/hex/bluetooth_bootstrap.hex')
    var program = new Program(hex)
    if (program.valid) {
      self.emit('flashBootstrapToHostBlock', hostBlock)
      var flash = new Flash(client, {
        skipSafeCheck: true
      })
      flash.programToBlock(program, hostBlock, function (err) {
        flash.removeListener('progress', onProgress)
        if (err) {
          callback(err)
        } else {
          async.series([
            retry({ times: 5, interval: 5000 }, waitForDisconnect),
            retry({ times: 5, interval: 5000 }, waitForReconnect)
          ], callback)
        }
      })
      flash.on('progress', onProgress)
      function onProgress(e) {
        self.emit('progress', e)
      }
    } else {
      callback(new Error('Invalid program.'))
    }
  }

  function waitForFinish(timeout) {
    return function (callback) {
      setTimeout(callback, timeout)
    }
  }
}

function retry(options, fn) {
  return async.retry.bind(null, options, fn)
}

util.inherits(Upgrade, events.EventEmitter)

module.exports = Upgrade
