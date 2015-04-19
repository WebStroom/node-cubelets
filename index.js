var cubelets = module.exports

cubelets.Protocol = require('./protocol/imago')
cubelets.Parser = require('./parser')
cubelets.Client = require('./client')

cubelets.Protocol.merge(cubelets)

// TODO
// var classic = {
//   Protocol = require('./protocol/classic'),
//   Parser = require('./protocol/classic/parser'),
//   Client = require('./protocol/classic/client')
// }
