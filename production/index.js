var respawn = require('respawn')

var monitor = respawn(['node', 'bin/upgrade.js', 'COM4'], {
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
	console.log('start')
});

monitor.on('stop', function()
{
	console.log('stop')
});

monitor.on('crash', function()
{
	console.log('crash')
});

monitor.on('stdout', function(data)
{
	console.log(data.toString('utf-8'));
});

monitor.on('stderr', function(data)
{
	console.log(data.toString('utf-8'));
});
monitor.start() // spawn and watch