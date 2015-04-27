var cubelets = module.exports

cubelets.Cubelet = require('./cubelet')
cubelets.Protocol = require('./protocol/imago')
cubelets.Parser = require('./parser')
cubelets.Client = require('./client')
cubelets.Construction = require('./construction')

var xtend = require('xtend/mutable')
xtend(cubelets, cubelets.Protocol.messages)
xtend(cubelets, { block: cubelets.Protocol.Block.messages })
