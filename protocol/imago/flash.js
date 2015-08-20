var events = require('events')
var util = require('util')
var async = require('async')
var Block = require('../../block')
var BlockTypes = require('../../blockTypes')
var MCUTypes = require('../../mcuTypes')
var Version = require('../../version')
var emptyFunction = function () {}
var __ = require('underscore')

var ValidTargetMCUTypes = [
  MCUTypes.PIC
]

function Flash(protocol, client) {
  events.EventEmitter.call(this)

  var self = this
  var messages = protocol.messages

  this.programToBlock = function (program, block, callback) {
    callback = callback || emptyFunction

    if (!block) {
      callback(new Error('Invalid block argument.'))
      return
    }

    if (!hasValidHopCount(block)) {
      callback(new Error('Invalid block hop count. Have you fetched the block yet?'))
      return
    }

    if (!hasValidTargetMCUType(block)) {
      callback(new Error('Invalid target MCU type: ' + block.getMCUType().typeId))
      return
    }

    if (!program.valid) {
      callback(new Error('Invalid program.'))
      return
    }

    var slot = {
      index: 0,
      blockTypeId: block.getBlockType().typeId,
      version: new Version(0, 0, 0),
      isCustom: false,
      crc: 0xcc
    }

    self.programToSlot(program, slot, function (err) {
      if (err) {
        callback(err)
      } else {
        self.slotToBlock(slot.index, block.getBlockId(), callback)
      }
    })
  }

  this.programToSlot = function (program, slot, callback) {
    var lineLength = 18
    var slotData = program.data
    var slotSize = Math.ceil(slotData.length / lineLength)
    var slotIndex = slot.index
    var blockTypeId = slot.blockTypeId
    var version = slot.version
    var isCustom = slot.isCustom
    var crc = slot.crc
    var request = new messages.UploadToMemoryRequest(slotIndex, slotSize, blockTypeId, version, isCustom, crc)
    var timeout = slotSize * 1000 // 1 second per line?

    var timer = setTimeout(function () {
      handleResult(new Error('Timed out waiting for upload to complete.'))
    }, timeout)
    
    client.on('event', waitForCompleteEvent)
    function waitForCompleteEvent(e) {
      if (e instanceof messages.UploadToMemoryCompleteEvent) {
        handleResult(null)
      }
    }

    client.sendRequest(request, function (err) {
      if (err) {
        handleResult(err)
      } else {
        var chunkSize = 60
        writeChunk(0)
        function writeChunk(i) {
          var start = i * chunkSize
          var end = start + chunkSize
          var chunk = slotData.slice(start, end)
          if (chunk.length > 0) {
            client.sendData(chunk, function (err) {
              if (err) {
                handleResult(err)
              } else {
                emitProgressEvent({
                  progress: start,
                  total: slotData.length,
                  action: 'upload'
                })
                writeChunk(i + 1)
              }
            })
          } else {
            emitProgressEvent({
              progress: slotData.length,
              total: slotData.length,
              action: 'upload'
            })
          }
        }
      }
    })

    function handleResult(err) {
      clearTimeout(timer)
      client.removeListener('event', waitForCompleteEvent)
      if (callback) {
        callback(err)
      }
    }

    function emitProgressEvent(e) {
      self.emit('progress', e)
    }
  }

  this.slotToBlock = function (slotIndex, blockId, callback) {
    callback = callback || emptyFunction

    var request = new messages.FlashMemoryToBlockRequest(blockId, slotIndex)

    client.sendRequest(request, function (err, response) {
      if (err) {
        callback(err)
      } else if (response.result !== 0) {
        callback(new Error('Flashing failed.'))
      } else {
        callback(null)
      }
    })
  }
}

function hasValidTargetMCUType(block) {
  return __(ValidTargetMCUTypes).contains(block.getMCUType())
}

function hasValidHopCount(block) {
  return block.getHopCount() > 0
}

util.inherits(Flash, events.EventEmitter)

module.exports = Flash
