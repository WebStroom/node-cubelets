var Protocol = require('../protocol')

var messages = {}

module.exports = new Protocol({
  commands: [],
  requests: [],
  responses: [],
  events: []
})

module.exports.messages = messages
