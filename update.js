var async = require('async')
var cubelets = require('./index')
var Protocol = cubelets.Protocol

var device = {
  WCC: { address: "00-04-3e-08-21-d1", channelID: 1 }
  GPW: { address: "00-04-3e-08-21-db", channelID: 1 }
}

var branches = {
  CLASSIC: 0,
  BOOTSTRAP: 1,
  IMAGO: 2
}

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

function detectBranch(client, callback) {
  console.log('detect branch')
  client.setProtocol(Protocol.Classic)
  client.keepAlive(function (err) {
    if (!err) {
      callback(null, branches.CLASSIC)
    } else {
      client.setProtocol(Protocol.Imago)
      client.getConfiguration(function (err, response) {
        if (!err) {
          callback(null,
            (response.customApplication === 2) ? 
              branches.BOOTSTRAP : branches.IMAGO)
        } else {
          callback(err)
        }
      })
    }
  })
}

function flashBootstrapIfNeeded(client, callback) {
  detectBranch(client, function (err, branch) {
    if (branch !== branches.BOOTSTRAP) {
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
  console.log('queue blocks until done')
  var waitingQueue = []
  var doneQueue = []

  function enqueue(q, block) {
    q.unshift(block)
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

  function getNeighborBlocks(callback) {
    client.getNeighborBlocks(function (err, response) {
      if (err) {
        callback(err)
      } else {
        response.blocks.forEach(function (block) {
          if (!exists(waitingQueue, block))
            enqueue(waitingQueue, block)
        })
        callback(null)
      }
    })
  }

  function flashBlock(callback) {
    if (empty(waitingQueue)) {
      callback(null)
    } else {
      var block = dequeue(waitingQueue)
      var typeId = block.type.id
      var program = programs[typeId]
      if (program) {
        client.flashProgramToBlock(block, program, callback)
      } else {
        callback(new Error('No program found for block type: ' + block.type ? block.type.name : block))
      }
    }
  }

  function waitIfEmpty(callback) {
    var delay = 7500
    if (waitingQueue.length === 0) {
      setTimeout(function () {
        callback(null)
      }, 5000)
    }
  }

  async.until(function () {
    return done
  }, function (next) {
    async.seq(
      getNeighborBlocks,
      flashBlock,
      waitIfEmpty
    )(next)
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
      }
    })
  }
})
