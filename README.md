node-cubelets
=============

Communicate with Cubelets using node.js

What are Cubelets?
==================

Cubelets are magnetic blocks that can be snapped together to make an endless variety of robots. You can communicate with and program them in node.js with a Bluetooth Cubelet.

Connect
=======

First, pair your Bluetooth Cubelet to OS X, Windows, or Linux. A serial connection will be used to communicate with the Cubelet using node-serialport.

To find the name of the device on OS X and Linux:

```
> ls /dev | grep Cubelet
cu.Cubelet-MOD
tty.Cubelet-MOD
```

On Windows, go to the Properties of the device in the Device Manager, and find the COM port for the Cubelet. The name will be something like "COM3", "COM42", etc.

Then, open a connection:

```
var cubelets = require('cubelets')

var device = {
  path: '/dev/cu.Cubelet-GPW-AMP-SPP'
}

var client = cubelets.connect(device, function (err) {
  console.log('connected to', device)
})

```

Discover
========

Once connected, you can discover other Cubelets connected to the Bluetooth Cubelet.

```
client.on('blocksChanged', function () {
  console.log('Origin block', construction.getOriginBlock())
  console.log('Neighbor blocks', construction.getNeighborBlocks())
  console.log('All blocks', construction.getAllBlocks())
  console.log('By ID', construction.findById(1234))
  console.log('By hop count', construction.filterByHopCount(2))
  console.log('Edges', construction.getEdges())
  console.log('Graph', construction.getGraph())
})

client.discoverBlocks()
```

The change event will fire when the robot construction changes in any detectable way, included if a block is added, removed, or moved.

Command
=======

Once Cubelets are discovered, you can send commands to them. For example, to blink the LED on a Cubelet with ID `1234`:

```
var LED = false // Off
setInterval(function() {
  client.sendBlockCommand(new cubelets.block.SetLED(1234, LED))
  LED = !LED
}, 500)
```

Request
=======


Notification
============

