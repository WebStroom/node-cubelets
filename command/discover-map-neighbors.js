var util = require('util');
var Command = require('../command');

var DiscoverMapNeighborsCommand = function() {
	Command.call(this);
};

util.inherits(DiscoverMapNeighborsCommand, Command);

DiscoverMapNeighborsCommand.prototype.encode = function() {
	return new Buffer([
		'm'.charCodeAt(0)
	]);
};

module.exports = DiscoverMapNeighborsCommand;