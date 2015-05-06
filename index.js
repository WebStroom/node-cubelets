var cubelets = module.exports

cubelets.Cubelet = require('./cubelet')
cubelets.Version = require('./version')
cubelets.Encoder = require('./encoder')
cubelets.Decoder = require('./decoder')
cubelets.Program = require('./program')

cubelets.Protocol = require('./protocol/imago')
cubelets.Client = require('./client/index')

var xtend = require('xtend/mutable')
xtend(cubelets, cubelets.Protocol.messages)
xtend(cubelets, { block: cubelets.Protocol.Block.messages })

cubelets._Parser = require('./parser')
cubelets._Connection = require('./connection')
cubelets._Construction = require('./construction')
cubelets._Client = require('./client')
