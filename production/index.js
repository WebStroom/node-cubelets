var args = process.argv
if (args.length !== 3) {
  console.log('Usage: node production PATH')
  process.exit(1)
}

var clc = require('cli-color');

var error = clc.red.bold;
var warn = clc.yellow;
var notice = clc.blue;
var success = clc.bgGreen.bold

var respawn = require('respawn')

var monitor = respawn(['node', 'bin/upgrade.js', args[2]], {
  env: {}, // set env vars
  cwd: '.',              // set cwd
  maxRestarts:10,        // how many restarts are allowed within 60s
                         // or -1 for infinite restarts
  sleep:1000,            // time to sleep between restarts,
  kill:30000,            // wait 30s before force killing after stopping
  stdio: []           // forward stdio options
})

monitor.on('start', function()
{
	
});

monitor.on('stop', function()
{
	console.log("The upgrade CLI has finished. Please restart if you need to update more blocks.")
});

monitor.on('crash', function()
{
	
});

var spawn_count = 0;
monitor.on('spawn', function(process)
{
	spawn_count++;
	if(spawn_count == 1)
	{
		console.log("Starting the OS4 Upgrade CLI...")
	}
	else
	{
		console.log("Restarting the OS4 Upgrade CLI...")
	}
});

monitor.on('warn', function(err){
	
})

monitor.on('stdout', function(data)
{
	console.log(data.toString('utf-8'));
});

monitor.on('stderr', function(data)
{
	console.log(error(data.toString('utf-8')));
});
monitor.start() // spawn and watch