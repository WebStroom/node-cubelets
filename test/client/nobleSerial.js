var cubelets = require('../../index')('nobleSerial');

var client;

function deviceAddedCallback(device){
  console.log("Device Added");
  cubelets.stopDeviceScan(function(){
    client = cubelets.connect(device, function(err){
      if(err){
        console.log(err);
        return;
      }
      console.log("Connected. Fetching neighborBlocks...");
      client.fetchNeighborBlocks(function (err, neighborBlocks) {
        if(err){
          console.log(err);
        }
        else{
          console.log("Found neighborBlocks: ");
          neighborBlocks.forEach(function(neighbor){
            console.log(neighbor.getBlockId())
          })
        }
      })
    })
  })
}
function deviceUpdatedCallback(device){
  console.log("Device Updated: ");
  //console.log(device);
}
cubelets.startDeviceScan(deviceAddedCallback, deviceUpdatedCallback, function(err){
  console.log(err);
});
