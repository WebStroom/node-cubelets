var events = require('events')
var util = require('util')
var Protocol = require('../protocol/imago').Block

var Parser = function () {
  events.EventEmitter.call(this)

  // Possible parser states
  var State = {
    HEADER_TYPE:1,
    HEADER_ID:2,
    HEADER_SIZE:3,
    BODY:4
  }

  // Initialize parser state
  var state = State.HEADER_TYPE
  var data = new Buffer(0)
  var code = -1
  var type = undefined
  var id = undefined
  var size = 0
  var index = 0
  var extraBytes = []

  // Main parse function
  this.parse = function (buffer) {

    data = Buffer.concat([data, buffer])

    function byteAt(i) {
      return data.readUInt8(i)
    }

    function nextByte() {
      return byteAt(index++)
    }

    function shouldParse() {
      var bytesToRead = data.length - index
      switch (state) {
        case State.HEADER_ID:
          return bytesToRead >= 3
        case State.BODY:
          return bytesToRead >= size
        default:
          return bytesToRead > 0
      }
    }

    function reset() {
      state = State.HEADER_TYPE
      data = data.slice(index)
      code = -1
      type = undefined
      id = undefined
      size = 0
      index = 0
    }

    function parseHeaderType() {
      code = nextByte()
      type = Protocol.typeForCode(code)
      state = State.HEADER_ID
    }

    function parseHeaderID() {
      var slice = data.slice(index, index + 3)
      id = Decoder.decodeID(slice)
      index += slice.length
      state = State.HEADER_SIZE
    }

    function parseHeaderSize() {
      size = nextByte()
      if (size > 0) {
        state = State.BODY
      } else {
        reset()
      }
    }

    function parseBody() {
      if (type) {
        var body = data.slice(index, index + size)
        emitMessage(body)
        index += body.length
      }
      reset()
    }

    function parseExtra() {
      for (var i = 0; i < index; ++i) {
        extraBytes.push(byteAt(i))
      }
      reset()
    }

    while (shouldParse()) {
      switch (state) {
        case State.HEADER_TYPE:
          parseHeaderType()
          break
        case State.HEADER_ID:
          parseHeaderID()
          break
        case State.HEADER_SIZE:
          parseHeaderSize()
          break
        case State.BODY:
          parseBody()
          break
      }
    }

    if (extraBytes.length > 0) {
      emitExtra(new Buffer(extraBytes))
      extraBytes = []
    }
  }

  var emitter = this

  // Emits a parsed response
  var emitMessage = function (body) {
    var message = new type(id)
    message.decode(body)
    emitter.emit('message', message)
  }

  // Emits extra data
  var emitExtra = function (data) {
    emitter.emit('extra', data)
  }
}

util.inherits(Parser, events.EventEmitter)
module.exports = Parser
