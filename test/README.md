test plan
=========

To run tests, first make sure `config.js` is set up properly. The `device` property should have the device information for the Cubelet in test. The `construction` property should match the physical cubelet construction.

To test with node:

`tap test/*.js` for all tests

`node test/single.js` for a single test

To test in the browser:

`browserify test/*.js | testling -x open` for all tests

`browserify test/single.js | testling -x open` for a single test

connection
----------
- tests if a device can connect/disconnect and respond to cubelet requests

flow
----
- tests flow control by testing maximum sending limits

communication
-------------
- tests messaging according to cubelets protocol

client
------
- tests accessibility of high level objects like the client and construction

construction
------------
- todo

flash
-----
- tests 