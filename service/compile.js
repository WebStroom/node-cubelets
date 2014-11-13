var util = require('util');
var events = require('events');
var socket = require('socket.io-client');
var config = require('../config.json');

var CompileService = function() {

    events.EventEmitter.call(this);

    var apiUrl = config['urls']['compile'];
    var socket = require('socket.io-client').connect(apiUrl);
    var service = this;

    socket.on('connect', function() {
    });
    
    socket.on('compileWarning', function(warning) {
        service.emit('compileWarning', warning);
    });

    socket.on('compileError', function(error) {
        service.emit('compileError', error);
    });

    socket.on('compileFailure', function() {
        service.emit('failed', new Error('Compilation failed.'));
    });

    socket.on('compileSuccess', function(data) {
        service.emit('complete', { hex: data['hexBlob'] });
    });

    function formatMCUFlag(mcu) {
        switch (mcu) {
            case 'avr': return 'avr168';
            case 'pic': return 'pic16';
            default: return mcu;
        }
    }
    function formatTypeFlag(type)
    {
        switch(type)
        {
            //LipPo Battery type is just v.2 of Battery
            case 3: return 2;
            default: return type;
        }
    }
    function formatBlockTypeVersion(cubelet)
    {
        switch(cubelet.type.id)
        {
            //LipPo Battery type is just v.2 of Battery
            case 3: return 2;
            default: return 1;
        }        
    }

    this.requestBuild = function(source, cubelet) {
        var flags = {
            version: 'master', //XXX
            coreVersion: 1,
            blockTypeVersion: formatBlockTypeVersion(cubelet),
            blockType: formatTypeFlag(cubelet.type.id),
            blockTypeString: cubelet.type.name,
            mcu: formatMCUFlag(cubelet.mcu)
        };
        socket.emit('compileRequest', {
            platform: 'cubelets',
            flags: flags,
            source: source.code
        }); 
    };
};

util.inherits(CompileService, events.EventEmitter);

module.exports = CompileService;