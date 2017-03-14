module.exports = function(clientType){
  return require('./'+clientType);
}
//module.exports = require('./serial')
//module.exports = require('./net)
//module.exports = require('./ws)
//etc.
