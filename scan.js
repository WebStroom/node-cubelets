var Client = require('./client/index')

Client.Scanner.listRobotDevices(function (devices) {
  console.log(devices)
})
