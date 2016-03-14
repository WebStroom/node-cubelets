var test = require('tape')
var fs = require('fs')
var ImagoFirmwareService = require('../../services/imagoFirmware')
var InfoService = require('../../services/info')
var Upgrade = require('../../upgrade')
var Block = require('../../block')
var BlockTypes = require('../../blockTypes')
var MCUTypes = require('../../mcuTypes')
var Version = require('../../version')
var ImagoProtocol = require('../../protocol/imago')
var ImagoProgram = ImagoProtocol.Program

var firmwareService = new ImagoFirmwareService()


test('Test bad version', function (t) {
  t.plan(1)  
  var block = new Block(1337, 99, BlockTypes.DISTANCE)
  block._mcuType = MCUTypes.PIC
  block._applicationVersion = null
  firmwareService.checkForUpdate(block, function(err, res)
  {
  	t.ok(err, "Fetching with invalid versions should produce an error")
  })
})

test('Test bad block type', function (t) {
  t.plan(1)
  var block = new Block(1337, 99, BlockTypes.UNKNOWN)
  firmwareService.checkForUpdate(block, function(err, res)
  {
  	t.ok(err, "Fetching with invalid block type should produce an error")
  })
})

test('Test check for updated version', function (t) {
  t.plan(3)
  var block = new Block(1337, 99, BlockTypes.THRESHOLD)
  block._mcuType = MCUTypes.PIC
  block._applicationVersion = new Version(4,0,0)
  block._bootloaderVersion = new Version(4,1,0)
  block._hardwareVersion = new Version(2,0,0)
  
  firmwareService.checkForUpdate(block, function(err, res)
  {
  	t.error(err, "Should not be an error with valid data")
  	t.ok(res.updateAvailable, "There should be an update available")
  	var program = new ImagoProgram(res.hexBlob)
  	t.ok(program.valid, "Hex file should be a valid program")
  })
})

test('Test fetch latest hex', function (t) {
  t.plan(3)
  var block = new Block(1337, 99, BlockTypes.DISTANCE)
  block._mcuType = MCUTypes.PIC
  block._applicationVersion = new Version(4,0,0)
  block._bootloaderVersion = new Version(4,1,0)
  block._hardwareVersion = new Version(2,0,0)
  
  firmwareService.fetchLatestHex(block, function(err, res)
  {
  	t.error(err, "Should not be an error with valid data")
  	t.ok(res.updateAvailable, "There should be an update available")
  	var program = new ImagoProgram(res.hexBlob)
  	t.ok(program.valid, "Hex file should be a valid program")
  })
})


test('Test check for bootloader update', function(t) {
	t.plan(4)
	var block = new Block(1337, 4, BlockTypes.BARGRAPH)
	block._mcuType = MCUTypes.PIC
	block._bootloaderVersion = new Version(4, 0, 0)
	block._hardwareVersion = new Version(2, 0, 0)

	firmwareService.checkForBootloaderUpdate(block, function(err, res) {
		t.error(err, "Should not be an error with valid data")
		t.ok(res.updateAvailable, "There should be an update available")
		var bootloaderProgram = new ImagoProgram(res.bootloaderHexBlob)
		var applicationProgram = new ImagoProgram(res.applicationHexBlob)
		t.ok(bootloaderProgram.valid, "Bootloader hex file should be a valid program")
		t.ok(applicationProgram.valid, "Application hex file should be a valid program")
	})
})

//Test bootstraps
test('Test get latest bootstrap', function(t) {
	t.plan(3);
	var block = new Block(1337, 4, BlockTypes.BARGRAPH)
	block._mcuType = MCUTypes.PIC
	block._bootloaderVersion = new Version(4, 0, 0)
	block._hardwareVersion = new Version(2, 0, 0)
		
	firmwareService.fetchBootstrapFirmware(block, function(err, res) {
		t.error(err, "Should not be an error with valid data")
		t.ok(res.updateAvailable, "There should be an update available")
		var bootloaderProgram = new ImagoProgram(res.hexBlob)
		t.ok(bootloaderProgram.valid, "Bootstrap hex file should be a valid program")
		
	})
})

//Test typeswitchs
test('Test get typeswitch', function(t) {
	t.plan(2);
	var block = new Block(1337, 4, BlockTypes.BARGRAPH)
	block._mcuType = MCUTypes.PIC
	block._bootloaderVersion = new Version(4, 0, 0)
	block._hardwareVersion = new Version(2, 0, 0)
		
	firmwareService.fetchTypeSwitchApplication(block, function(err, res) {
		t.error(err, "Should not be an error with valid data")
		var bootloaderProgram = new ImagoProgram(res.hexBlob)
		t.ok(bootloaderProgram.valid, "Type Switch hex file should be a valid program")
		
	})
})

//Test Deep Memory Bootloader
test('Test get deep memory bootloader', function(t) {
	t.plan(2);
	var block = new Block(1337, 4, BlockTypes.BARGRAPH)
	block._mcuType = MCUTypes.PIC
	block._bootloaderVersion = new Version(4, 0, 0)
	block._hardwareVersion = new Version(2, 0, 0)
		
	firmwareService.fetchDeepMemoryBootloader(block, function(err, res) {
		t.error(err, "Should not be an error with valid data")
		var bootloaderProgram = new ImagoProgram(res.hexBlob)
		t.ok(bootloaderProgram.valid, "The hex file should be a valid program")
		
	})
})

//Test Modified bootstrap
test('Test get major update bootstrap', function(t) {
	t.plan(2);
	var block = new Block(1337, 4, BlockTypes.BARGRAPH)
	block._mcuType = MCUTypes.PIC
	block._bootloaderVersion = new Version(4, 0, 0)
	block._hardwareVersion = new Version(2, 0, 0)
		
	firmwareService.fetchMajorUpdateBootstrap(block, function(err, res) {
		t.error(err, "Should not be an error with valid data")
		var bootloaderProgram = new ImagoProgram(res.hexBlob)
		t.ok(bootloaderProgram.valid, "Bootstrap hex file should be a valid program")
		
	})
})

//Check for cache miss
test('Test cache miss', function(t) {
	t.plan(3);
	var block = new Block(1337, 4, BlockTypes.PASSIVE	)
	block._mcuType = MCUTypes.PIC
	block._bootloaderVersion = new Version(4, 0, 0)
	block._hardwareVersion = new Version(2, 0, 0)
		
	firmwareService.fetchMajorUpdateBootstrap(block, function(err, res) {
		t.error(err, "Should not be an error with valid data")
		var bootloaderProgram = new ImagoProgram(res.hexBlob)
		t.ok(bootloaderProgram.valid, "Bootstrap hex file should be a valid program")
		t.notOk(res.cacheHit)		
	})
})

//Check for cache hit
test('Test for cache hit', function(t) {
	t.plan(3);
	var block = new Block(1337, 4, BlockTypes.PASSIVE	)
	block._mcuType = MCUTypes.PIC
	block._bootloaderVersion = new Version(4, 0, 0)
	block._hardwareVersion = new Version(2, 0, 0)
		
	firmwareService.fetchMajorUpdateBootstrap(block, function(err, res) {
		t.error(err, "Should not be an error with valid data")
		var bootloaderProgram = new ImagoProgram(res.hexBlob)
		t.ok(bootloaderProgram.valid, "Bootstrap hex file should be a valid program")
		t.ok(res.cacheHit, "Should have hit cache")		
	})
})

//Check for disk fallback
test.skip('Test for disk fallback', function(t) {
	t.plan(1);
	
})

