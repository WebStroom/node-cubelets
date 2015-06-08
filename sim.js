var args = process.argv
if (args.length !== 2) {
  console.log('Usage: node sim PORT')
  process.exit(1)
}

var TCPServer = require('../server/tcp')
var port = parseInt(process.argv[1])

TCPServer.listen(port, function () {
  console.log('server listening on port', port)
})
