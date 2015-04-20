var cubelets = module.exports

cubelets.Cubelet = require('./cubelet')
cubelets.Protocol = require('./protocol/imago')
cubelets.Parser = require('./parser')
cubelets.Client = require('./client')
cubelets.Construction = require('./construction')

cubelets.Protocol.merge(cubelets)

// TODO
// var classic = {
//   Protocol = require('./protocol/classic'),
//   Parser = require('./protocol/classic/parser'),
//   Client = require('./protocol/classic/client')
// }
