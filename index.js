module.exports.Types = require('./config.json')['types'];
module.exports.Requests = require('./config.json')['requests'];
module.exports.Commands = require('./config.json')['commands'];
module.exports.Responses = require('./config.json')['responses'];

module.exports.GetConfigurationRequest = require('./request/getConfiguration');
module.exports.EchoRequest = require('./request/echo');

module.exports.SetLEDColorCommand = require('./command/setLEDColor');
