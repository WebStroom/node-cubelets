var util = require('util');
var Command = require('../command');

var ResetBluetoothCubeletCommand = function() {
    Command.call(this);
    this.code = 'x';
};

util.inherits(ResetBluetoothCubeletCommand, Command);

ResetBluetoothCubeletCommand.prototype.encode = function() {
    return new Buffer([
        this.code.charCodeAt(0)
    ]);
};

module.exports = ResetBluetoothCubeletCommand;