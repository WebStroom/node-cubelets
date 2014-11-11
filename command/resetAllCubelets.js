var util = require('util');
var Command = require('../command');

var ResetBluetoothCommand = function() {
    Command.call(this);
    this.code = 'x';
};

util.inherits(ResetBluetoothCommand, Command);

ResetBluetoothCommand.prototype.encode = function() {
    return new Buffer([
        this.code.charCodeAt(0)
    ]);
};

module.exports = ResetBluetoothCommand;