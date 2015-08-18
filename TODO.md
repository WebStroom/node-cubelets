high
----
- detect incompatible avr block types in upgrade.js

medium
------
X move block getters into base strategy
- re-implement read block message handler with streams and back pressure
X add remaining virtual methods to base strategy
X command queue timer keeps running preventing clean shutdowns, so disable timer when no commands

low
---
X eliminate callbacks on command writes
- fix bug in tcp network cubelet client (when multiple clients running?)
- think about how to set strategy in the middle of an async call chain
  - ensure calls are calling correct strategy in correct scope
X upsert neighbors immediately
X consistency between getBlocks, getAllBlocks
- break out getting block types into base strategy
  - fetchBlockConfigurations
    - imago: block req
    - classic: data store
  - fetchBlockNeighbors
    - imago: block req
    - classic: n/a