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

      test('jump to os4 mode', function (t) {
      	t.plan(2);
        client.setProtocol(UpgradeProtocol);
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(1), function (err, response) {
          t.ifError(err);
          t.equals(response.mode, 1);
        });
      });
      
      test('jump to discovery mode from OS4', function (t) {
      	t.plan(1);
        client.setProtocol(ImagoProtocol);
        client.sendCommand(new ImagoProtocol.messages.ResetCommand());
        setTimeout(function(){
        	t.pass("Sent reset command");
        }, 500);
      });
      
      //TODO: make sure we are getting discovery mode packets
      
      test('jump to os3 mode', function (t) {
      	t.plan(2);
        client.setProtocol(UpgradeProtocol);
        client.sendRequest(new UpgradeProtocol.messages.SetBootstrapModeRequest(0), function (err, response) {
          t.ifError(err);
          t.equals(response.mode, 0);
        });
      });
      
      test('jump to discovery mode from OS3', function (t) {
      	t.plan(1);
        client.setProtocol(ClassicProtocol);
        client.sendCommand(new ClassicProtocol.messages.ResetCommand());
        setTimeout(function(){
        	t.pass("Sent reset command");
        }, 500);
      });
      
      //TODO: make sure we are getting discovery mode packets      

      test('disconnect', function (t) {
        t.plan(1);
        client.disconnect(t.ifError);
      });
    }
  });
});
