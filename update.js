var cubelets = require('./index')
var device = require('./test/config').device
var Protocol = cubelets.Protocol

cubelets.connect(device, function (err, client) {
  detect(client, function (protocol) {
    if (protocol === Protocol.Imago) {
      console.log('detected imago protocol')
    } else if (protcol === Protocol.Classic) {
      console.log('detected classic protocol')
    } else {
      console.error('could not detect protocol')
    }
    client.disconnect()
  })
})

function detect(client, callback) {
  client.sendRequest(new Protocol.Classic.messages.KeepAliveRequest(), function (err) {
    if (err) {
      client.sendRequest(new Protocol.Imago.messages.EchoRequest(), function (err) {
        if (err) {
          callback(null)
        } else {
          callback(Protocol.Imago)
        }
      })
    } else {
      callback(Protocol.Classic)
    }
  })
}
