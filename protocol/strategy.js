var CommandBuffer = require('./commandBuffer')
var RequestQueue = require('./requestQueue')

function Strategy(protocol, client) {

  var messages = protocol.messages
  var commandBuffer = new CommandBuffer(client, 1000/10)
  var requestQueue = new RequestQueue(client)

  this.sendMessage = function (message, callback) {
    client.sendData(message.encode(), callback)
  }

  this.sendCommand = function (command, callback) {
    commandBuffer.push(command)
  }

  this.sendRequest = function (request, callback, timeout) {
    requestQueue.push(request, callback, timeout)
  }

  this.sendBlockRequest = function (blockRequest, callback, timeout) {
    throw new Error('not implemented')
  }

  this.ping = function (callback) {
    throw new Error('not implemented')
  }

  this.echo = function (data, callback) {
    throw new Error('not implemented')
  }

  this.fetchConfiguration = function (callback) {
    throw new Error('not implemented')
  }

  this.getConfiguration = function () {
    throw new Error('not implemented')
  }

  this.fetchOriginBlock = function (callback) {
    throw new Error('not implemented')
  }

  this.getOriginBlock = function () {
    throw new Error('not implemented')
  }

  this.fetchNeighborBlocks = function (callback) {
    throw new Error('not implemented')
  }

  this.getNeighborBlocks = function () {
    throw new Error('not implemented')
  }

  this.fetchAllBlocks = function (callback) {
    throw new Error('not implemented')
  }

  this.getAllBlocks = function () {
    throw new Error('not implemented')
  }

  this.startBlockDiscovery = function (callback) {
    throw new Error('not implemented')
  }

  this.stopBlockDiscovery = function (callback) {
    throw new Error('not implemented')
  }

  this.findBlockById = function (id) {
    throw new Error('not implemented')
  }

  this.filterBlocksByHopCount = function (hopCount) {
    throw new Error('not implemented')
  }

  this.setBlockValue = function (id, value, callback) {
    client.sendCommand(new messages.SetBlockValueCommand(id, value), callback)
  }

  this.clearBlockValue = function (id, callback) {
    client.sendCommand(new messages.ClearBlockValueCommand(id, value), callback)
  }

  this.registerBlockValueEvent = function (id, callback) {
    client.sendRequest(new messages.RegisterBlockValueEventRequest(id), callback)
  }

  this.unregisterBlockValueEvent = function (id, callback) {
    client.sendRequest(new messages.UnregisterBlockValueEventRequest(id), callback)
  }

  this.unregisterAllBlockValueEvents = function (callback) {
    client.sendRequest(new messages.UnregisterAllBlockValueEventsRequest(), callback)
  }

  this.flashProgramToBlock = function (program, block, callback) {
    throw new Error('not implemented')
  }

}

module.exports = Strategy
