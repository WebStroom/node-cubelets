var test = require('tape');
var config = require('./config');
var cubelets = require('../index');
var Upgrade = require('../upgrade');
var UpgradeProtocol = require('../protocol/bootstrap/upgrade');
var ImagoProtocol = require('../protocol/imago');
var ClassicProtocol = require('../protocol/classic');
var __ = require('underscore');

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1);
    if (err) {
      t.end(err);
    } else {
      t.pass('connected');

      var upgrade = new Upgrade(client);

      /*test('detect firmware', function (t) {
        t.plan(3);
        upgrade.detectIfNeeded(function (err, needsUpgrade, firmwareType) {
          t.ifError(err, 'no err');
          t.ok(needsUpgrade, 'needs upgrade');
          t.equal(firmwareType, 0, 'has classic firmware');
        });
      });*/

      test('jump to OS4 mode', function (t) {
      	t.plan(2);
        client.setProtocol(UpgradeProtocol);
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(1), function (err, response) {
          t.ifError(err);
          t.equals(response.mode, 1);
        });
      });
      
      test('jump to discovery mode from OS4', function (t) {
      	t.plan(1);
      	
      	var timeout;
      	
        client.setProtocol(ImagoProtocol);
        client.sendCommand(new ImagoProtocol.messages.ResetCommand());
        setTimeout(function(){
        	var listener = function(e)
        	{
        		if ( e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
		  			clearTimeout(timeout);
		  			client.removeListener('event', listener);
		  			clearTimeout(timeout);
		  			t.pass("Jumped to discovery from OS4");
		  		}
        	};
        	
        	//Listen for BlockFoundEvents
	      	client.on('event', listener);		  		
		  	
		  	//Change to to Upgrade/Discovery Protocol
        	client.setProtocol(UpgradeProtocol);
        	
        	//Timeout of we don't receive a BlockFoundEvent in specified time
        	timeout = setTimeout(function()
        	{
        		//Detach from even emitter
        		client.removeListener('event', listener);
        		t.fail("Failed to jump to discovery from OS4");
        	}, 1000);
        }, 500);
      });
      
      
      
      test('jump to OS3 mode', function (t) {
      	t.plan(2);
        client.setProtocol(UpgradeProtocol);
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(0), function (err, response) {
          t.ifError(err);
          t.equals(response.mode, 0);
        });
      });
            
      test('jump to discovery mode from OS3', function (t) {
      	t.plan(1);
      	
      	var timeout;
      	
        client.setProtocol(ClassicProtocol);
        client.sendCommand(new ClassicProtocol.messages.ResetCommand());
        setTimeout(function(){
        	var listener = function(e)
        	{
        		if ( e instanceof UpgradeProtocol.messages.BlockFoundEvent) {
		  			clearTimeout(timeout);
		  			client.removeListener('event', listener);
		  			clearTimeout(timeout);
		  			t.pass("Jumped to discovery from OS4");
		  		}
        	};
        	
        	//Listen for BlockFoundEvents
	      	client.on('event', listener);		  		
		  	
		  	//Change to to Upgrade/Discovery Protocol
        	client.setProtocol(UpgradeProtocol);
        	
        	//Timeout of we don't receive a BlockFoundEvent in specified time
        	timeout = setTimeout(function()
        	{
        		//Detach from even emitter
        		client.removeListener('event', listener);
        		t.fail("Failed to jump to discovery from OS3");
        	}, 1000);
        }, 500);
      });
            
      //Tests:      
      //Make user confirm that dev OS3 block is attached      
      //Detect OS3 Cubelet
      //Jump to OS3
      //Request map
      //Make sure dev OS3 block shows up
      //Flash pic bootstrap+bootloader
      //Confirm flash success
      //Send reset (OS3)
      //Wait
      //Make sure imago block shows up on same face
      //Jump to imago
      //Flash imago application
      //Verify success
      //Send reset (OS4)

      test('disconnect', function (t) {
        t.plan(1);
        client.disconnect(t.ifError);
      });
    }
  });
});
