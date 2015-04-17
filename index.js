var cubelets = module.exports

cubelets.Protocol = require('./protocol/imago')
cubelets.Parser = require('./parser')
cubelets.Client = require('./client')

cubelets.Protocol.merge(cubelets)
