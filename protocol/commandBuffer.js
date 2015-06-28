var __ = require('underscore')

module.exports = function CommandBuffer(client, rate) {

  var commands = []

  var timer = setInterval(function () {
    if (commands.length > 0) {
      client.sendMessage(commands.pop())
      console.log('send command')
    }
  }, rate)

  this.push = function(command) {
    var index = __(commands).findIndex(function (otherCommand) {
      return otherCommand.prioritize(command) > 0
    })
    if (index > -1) {
      commands[index] = command
    } else {
      commands.unshift(command)
    }
  }

  this.unref = function () {
    clearInterval(timer)
  }

}
