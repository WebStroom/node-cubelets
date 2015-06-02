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
      callback(null, client, branches.CLASSIC)
    } else {
      client.setProtocol(Protocol.Imago)
      client.getConfiguration(function (err, response) {
        if (!err) {
          callback(null, client,
            (response.customApplication === 2) ? 
              branches.BOOTSTRAP : branches.IMAGO)
        } else {
          callback(err, client)
        }
      })
    }
  })
}

function flash(client, branch, callback) {
  console.log('flash')
  switch (branch) {
    case branches.BOOTSTRAP:
      callback(null, client)
      break
    default:
      flashBootstrap(client, callback)
      break
  }
}

function flashBootstrap(client, callback) {
  callback(null, client)
}

function flashImago(client, callback) {
  callback(null, client)
}

function queueUntilDone(client, callback) {
  console.log('queue until done')
  var waitingQueue = []
  var doneQueue = []
  function enqueue(q, id) {
    !exists(q, id) && q.unshift(id)
  }
  function dequeue(q) {
    return q.pop(q)
  }
  function exists(q, id) {
    return q.indexOf(id) > -1
  }
  async.until(function () {
    return done
  }, function (callback) {
    client.getNeighborBlocks(function (err, blocks) {
      if (err) {
        callback(err)
      } else {
        blocks.forEach(function (block) {
          var id = block.id
          if (!exists(doneQueue, id)) {
            enqueue(waitingQueue, id)
          }
        })
      }
    })
  }, callback.bind(this, client))
}

function update(device, callback) {
  console.log('update')
  async.seq([
    cubelets.connect,
    detectBranch,
    queueUntilDone,
    client.disconnect
  ], device, callback)

  this.done = function () {
    done = true
  }
}

cubelets.connect(device, function (err, client) {
  if (err) {
    console.err('connect', err)
  } else {
    update(client, function (err) {
      if (err) {
        console.err('update', err)
      }
    })
  }
})
