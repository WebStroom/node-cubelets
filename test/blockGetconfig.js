var test = require('tape')
var config = require('./config')
var cubelets = require('../index')
var ImagoProtocol = require('../protocol/imago')
var __ = require('underscore')
var Version = require("../version")

//Default for bootloader in make file
var testBootloaderBlock = 	{	blockId: 591879,
								hardwareVersion: new Version(1,0,0),
								bootloaderVersion: new Version(1,0,0),
								applicationVersion: new Version(0,0,0),
								blockTypeId: 6,
								mode: 0,
								hasCustomApplication: false
							}

//Default for passive in makefile							
var testApplicationBlock = 	{	blockId: 197121,
								hardwareVersion: new Version(1,0,0),
								bootloaderVersion: new Version(1,0,0),
								applicationVersion: new Version(1,0,0),
								blockTypeId: 6,
								mode: 1,
								hasCustomApplication: false
							}

var client = cubelets.connect(config.device, function (err) {
  test('connected', function (t) {
    t.plan(1)
    if (err) {
      t.end(err)
    } else {
      t.pass('connected')

      test('find a neighbor and get its config', function (t) {
        t.plan(11)
        client.setProtocol(ImagoProtocol)
        client.fetchNeighborBlocks(function (err, neighborBlocks) {
          t.ifError(err, 'fetched neighbors')
          t.ok(neighborBlocks.length > 0, 'found at least one neighbor')
          __(neighborBlocks).each(function (block) {
        	var request = new ImagoProtocol.Block.messages.GetConfigurationRequest(block.getBlockId())
            client.sendBlockRequest(request, function (err, response) {
            	t.ifError(err, 'fetched configuration')
            	
            	var testBlock;
            	if(response.mode === 0)
            	{
            		testBlock = testBootloaderBlock
            	}
            	else
            	{
            		testBlock = testApplicationBlock
            	}
            	//Compare ID
            	t.equal(testBlock.blockId, response.blockId, "IDs should match")
            	
            	//Compare Versions
            	t.ok(testBlock.hardwareVersion.isEqual(response.hardwareVersion), "hardware versions should match")
            	t.ok(testBlock.bootloaderVersion.isEqual(response.bootloaderVersion), "bootloader versions should match")
            	t.ok(testBlock.applicationVersion.isEqual(response.applicationVersion), "application versions should match")
            	
            	//Compare block type
            	t.equal(testBlock.blockTypeId, response.blockTypeId, "Block types should match")
            	
            	//Compare custom application
            	t.equal(testBlock.hasCustomApplication, response.hasCustomApplication, "Custom application flag should match")
            	
            	//Compare mode
            	t.equal(testBlock.mode, response.mode, "mode should match")
            	
            	t.pass('done')
            })          	
          })
          
        })
      })

      test('disconnect', function (t) {
        t.plan(1)
        client.disconnect(t.ifError)
      })
    }
  })
})
