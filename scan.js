var Client = require('./client/serial')
Client.Scanner.listRobotDevices(function (devices) {
  console.log(devices)
})