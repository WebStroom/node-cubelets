var through = require('through2')
var Version = require('./version')
var Cubelet = require('./cubelet')
var Protocol = require('./protocol/imago')
var Message = Protocol.Message
var __ = require('underscore')

function Demo(socket) {
  var blockId = 1337
  var hardwareVersion = new Version(2, 0, 0)
  var bootloaderVersion = new Version(4, 0, 0)
  var applicationVersion = new Version(4, 0, 0)
  var mode = 1
  var customApplication = 0

  var allBlocks = []

  function getAllBlocks() {
    return allBlocks
  }

  function addBlock(block) {
    allBlocks.push(block)
  }

  function removeBlock(block) {
    var i = allBlocks.indexOf(block)
    if (i > -1) {
      allBlocks.splice(i, 1)
    }
  }

  var parser = new Protocol.Parser()
  var messages = Protocol.messages

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
    var blocks = getAllBlocks().filter(function (block) {
      return block.hopCount === 1
    })
    send(new messages.GetNeighborBlocksResponse(blocks))
  })

  reply(messages.GetAllBlocksRequest, function (req) {
    console.log('get all blocks?', req)
    var blocks = getAllBlocks()
    send(new messages.GetAllBlocksResponse(blocks))
  })

  reply(messages.WriteBlockMessageRequest, function (req) {
    send(new messages.WriteBlockMessageResponse(0))

    var bm = Protocol.Block.messages
    var PingRequest = bm.PingRequest
    var PongResponse = bm.PongResponse
    var GetConfigurationRequest = bm.GetConfigurationRequest
    var GetConfigurationResponse = bm.GetConfigurationResponse

    var blockRequest = req.blockMessage
    var blockId = blockRequest.blockId

    switch (blockRequest.code()) {
      case PingRequest.code:
        sendReadBlockMessageEvent(new PongResponse(blockId, blockRequest.payload))
        break
      case GetConfigurationRequest.code:
        var res = new GetConfigurationResponse(blockId)
        res.blockId = blockId
        res.hardwareVersion = hardwareVersion
        res.bootloaderVersion = bootloaderVersion
        res.applicationVersion = applicationVersion
        res.mode = mode
        res.customApplication = customApplication
        res.blockTypeId = Cubelet.BlockTypes.UNKNOWN
        var block = __(allBlocks).find(function (block) {
          return block.blockId === blockId
        })
        if (block) {
          res.blockTypeId = block.blockType.typeId
        }
        sendReadBlockMessageEvent(res)
        break
    }

    function sendReadBlockMessageEvent(blockResponse) {
      send(new messages.ReadBlockMessageEvent(blockResponse))
    }
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
  stream.getAllBlocks = getAllBlocks
  stream.mutate = mutate

  function mutate() {
    allBlocks = []

    function rand(n) {
      return Math.floor(n * Math.random())
    }

    var maxHop = 3 + rand(4)

    function blocksPerHop(hop) {
      return hop * (1 + rand(hop / 2))
    }

    function choices(n) {
      var map = {}

      var stride = (n / 2)
      var i = rand(n)
      var max = 0
      
      this.choose = function () {
        if (max === n) {
          return -1
        } else {
          var x = i
          while (map[x]) {
            i = (i + rand(stride)) % n
            x = i
          }
          map[x] = true
          max++
          return x
        }
      }
    }

    function any(A) {
      return A[rand(A.length)]
    }

    var ids = new choices(10000)
    var blockTypes = __(Cubelet.BlockTypes).values()

    for (var hop = 1; hop < maxHop; ++hop) {
      var numBlocks = blocksPerHop(hop)
      var faces = new choices(6)
      for (var i = 0; i < numBlocks; ++i) {
        addBlock({
          blockId: ids.choose(),
          faceIndex: faces.choose(),
          hopCount: hop,
          blockType: any(blockTypes)
        })
      }
    }
  }

  mutate()

  return stream
}

module.exports = Demo
