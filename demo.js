var through = require('through2')
var Version = require('./version')
var Cubelet = require('./cubelet')
var Protocol = require('./protocol/imago')
var Message = Protocol.Message

function Demo(socket) {
  var blockId = 1337
  var hardwareVersion = new Version(2, 0, 0)
  var bootloaderVersion = new Version(4, 0, 0)
  var applicationVersion = new Version(4, 0, 0)
  var mode = 1
  var customApplication = 0
  var blocks = []

  function getBlocks() {
    return blocks
  }

  function addBlock(block) {
    blocks.push(block)
  }

  function removeBlock(block) {
    var i = blocks.indexOf(block)
    if (i > -1) {
      blocks.splice(i, 1)
    }
  }

  var parser = new Protocol.Parser()
  var messages  = Protocol.messages

  var replies = {}
  function reply(Request, handler) {
    replies[Request.code] = function (req) {
      handler(req)
    }
  }

  reply(messages.GetConfigurationRequest, function (req) {
    var res = new messages.GetConfigurationResponse()
    console.log('get configuration?', req)
    res.blockId = blockId
    res.hardwareVersion = hardwareVersion
    res.bootloaderVersion = bootloaderVersion
    res.applicationVersion = applicationVersion
    res.mode = mode
    res.customApplication = customApplication
    send(res)
  })

  reply(messages.GetModeRequest, function (req) {
    console.log('get mode?', req)
    send(new messages.GetModeResponse(mode))
  })

  reply(messages.EchoRequest, function (req) {
    console.log('echo?', req)
    send(new messages.EchoResponse(req.echo))
  })

  reply(messages.GetNeighborBlocksRequest, function (req) {
    console.log('get neighbor blocks?', req)
    var blocks = getBlocks()
    send(new messages.GetNeighborBlocksResponse(blocks.filter(function (block) {
      return block.hopCount === 1
    })))
  })

  reply(messages.GetAllBlocksRequest, function (req) {
    console.log('get all blocks?', req)
    var blocks = getBlocks()
    send(new messages.GetAllBlocksResponse(blocks))
  })

  reply(messages.UploadToMemoryRequest, function (req) {
    console.log('upload to memory?', req)
    // var lineSize = 18
    // var progress = 0
    // var total = req.slotSize * lineSize
    // parser.setRawMode(true)
    // parser.on('raw', function listener(data) {
    //   progress += data.length
    //   console.log('progress', progress)
    //   if (progress >= slotSize) {
    //     parser.removeListener('raw', listener)
    //     parser.setRawMode(false)
    //     var extra = progress - slotSize
    //     parser.parse(data.slice(data.length - extra))
    //     console.log('parsing', extra, 'extra bytes')
    //   }
    // })
    send(new messages.UploadToMemoryResponse(0))
    setTimeout(function () {
      send(new messages.UploadToMemoryCompleteEvent())
    }, 1000)
  })

  reply(messages.FlashMemoryToBlockRequest, function (req) {
    console.log('flash memory to block?', req)
    //TODO: add flashing mutex
    var blockId = req.blockId
    var delay = 1000
    // var count = 10
    var count = 1
    var i = 0
    var size = 4000 //TODO: look up size in slotIndex
    // var interval = setInterval(function () {
    //   var progress = Math.ceil(i / count * size)
    //   send(new messages.FlashProgressEvent(blockId, progress))
    //   i++
    // }, delay)
    setTimeout(function () {
      // clearInterval(interval)
      send(new messages.FlashMemoryToBlockResponse(0))
    }, count * delay)
  })

  parser.on('message', function (msg) {
    var code = msg.code()
    var reply = replies[code]
    if (typeof reply === 'function') {
      reply(msg)
      stream.emit('request', msg)
    } else {
      stream.emit('command', msg)
    }
  })

  var stream = through(function write(chunk, enc, next) {
    socket.write(chunk, enc, next)
  })

  socket.on('data', function (chunk) {
    parser.parse(chunk)
  })

  socket.on('end', function () {
    stream.end()
  })

  function send(msg) {
    stream.write(msg.encode())
  }

  stream.addBlock = addBlock
  stream.removeBlock = removeBlock
  stream.getBlocks = getBlocks

  return stream
}

module.exports = Demo
