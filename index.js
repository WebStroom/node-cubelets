module.exports.Types = require('./config.json')['types'];
module.exports.Requests = require('./config.json')['requests'];
module.exports.Responses = require('./config.json')['responses'];

module.exports.GetConfigurationRequest = require('./request/getConfiguration');
module.exports.GetRoutingTableRequest = require('./request/getRoutingTable');
module.exports.RegisterBlockValueEventRequest = require('./request/registerBlockValueEvent');
module.exports.EchoRequest = require('./request/echo');

module.exports.SetLEDColorCommand = require('./request/setLEDColor');
module.exports.SetBlockValueCommand = require('./request/setBlockValue');
