node-cubelets
=============

Communicate with Cubelets using node.js

What are Cubelets?
==================

Cubelets are magnetic blocks that can be snapped together to make an endless variety of robots. You can communicate with and program them in node.js with a Bluetooth Cubelet.

Install (Windows)
=================

    - NodeJs v0.10.40: https://nodejs.org/dist/v0.10.40/node-v0.10.40-x86.msi
    - Python 2.7
    - Git
    - Visual Studio 2013 Express: https://www.microsoft.com/en-us/download/details.aspx?id=44914
    - npm update -g npm
    - npm install --msvs_version=2013

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
// Listen for incremental updates to the graph,
// as data becomes available.
client.on('updateBlockMap', function () {
  console.log('Origin block', client.getOriginBlock())
  console.log('Neighbor blocks', client.getNeighborBlocks())
  console.log('All blocks (except origin)', client.getAllBlocks())
  console.log('By ID', client.findBlockById(1234))
  console.log('By hop count', client.filterBlocksByHopCount(2))
  console.log('Graph', client.getGraph())
})

// Fetch the graph. Callback is fired once entire
// graph has been retrieved.
client.fetchGraph(function (err, graph) {
  console.log('Nodes:', graph.nodes)
  console.log('Edges:', graph.links)
})
```
